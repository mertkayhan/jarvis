from typing import Any, Optional, cast
from jarvis.chat.chat_title import create_chat_title
from jarvis.context.context import FaithfullnessParams
from jarvis.graphrag.graphrag import query_documents
import logging
from dotenv import load_dotenv
from jarvis.graphrag.workflow import execute_workflow
from jarvis.messages.type import Message
from jarvis.messages.utils import (
    build_system_message,
    convert_to_langchain_message,
    new_server_message,
)
from jarvis.tools.tools import bootstrap_tools
from jarvis.agent.base import build_graph
from jarvis.namespaces import Base
from jarvis.queries.query_handlers import (
    create_chat,
    create_message,
    get_chat_docs,
    get_chat_model,
    get_doc_tokens,
    read_docs_helper,
    set_chat_model,
    update_chat,
    get_model_selection,
    update_chat_title,
    update_document_pack_status,
)
from jarvis.context import Context
import asyncio
from jarvis.models.models import model_factory


load_dotenv()

logger = logging.getLogger(__name__)


class Jarvis(Base):

    async def on_join_pack_room(self, sid, data):
        logger.info(f"{sid} requesting to join room for pack {data['room_id']}")
        await self._room_resolver(sid, data["room_id"])

    async def on_build_document_pack(self, sid, data):
        try:
            rooms = self.rooms(sid, self.namespace)
            if data["pack_id"] not in rooms:
                await self.enter_room(sid, data["pack_id"], self.namespace)
            await update_document_pack_status(data["pack_id"], "parsing")
            await self.emit(
                "workflow_update", {"stage": "parsing"}, room=data["pack_id"]
            )
            async for result in execute_workflow(data):
                await update_document_pack_status(
                    data["pack_id"], result["message"]["stage"]
                )
                await self.emit(
                    "workflow_update", result["message"], room=data["pack_id"]
                )
                if result["failed"]:
                    return "fail"
            return "done"
        except Exception as err:
            logger.error(f"document pack creation failed: {err}", exc_info=True)
            return "fail"

    async def on_query_docs(self, sid, data):
        pack_id = data["pack_id"]
        query = data["query"]
        logger.info(f"received graphrag query: {query}")
        res = await query_documents(pack_id, query)
        return res["local"]

    async def on_chat_message(self, sid: str, data: Message):
        logger.info(f"received message: {data}")
        user_id: str = data["userId"]
        chat_id: str = data["chatId"]
        additional_data: dict[str, Any] = cast(dict[str, Any], data.get("data", {}))

        # create chat
        if additional_data.get("first_message"):
            await self._create_chat(chat_id, user_id, sid)
            await self.history_handler.add_chat(chat_id)
        # broadcast message to other participants
        await self.emit(
            "chat_broadcast", data, room=chat_id, skip_sid=sid, namespace=self.namespace
        )

        # generate system prompt if necessary
        messages: list[Message] = []
        logger.info(
            f"personality: {additional_data.get('personality', {}).get("name")}"
        )
        instruction: Optional[str] = additional_data.get("personality", {}).get(
            "instructions"
        )
        chat_doc_ids: list[str] = additional_data.get("docs", [])
        personality_doc_ids: Optional[list[str]] = additional_data.get(
            "personality", {}
        ).get("doc_ids")

        # this is the first message
        if additional_data.get("first_message") and instruction:
            personality: dict[str, Any] = additional_data.get("personality", {})
            await self._first_message_handler(
                sid,
                chat_doc_ids,
                instruction,
                personality_doc_ids,
                chat_id,
                personality,
                messages,
                user_id,
            )

        # we need to check if we received additional docs
        if not additional_data.get("first_message") and len(chat_doc_ids) > 0:
            personality: dict[str, Any] = additional_data.get("personality", {})
            await self._additional_docs_handler(
                sid, chat_id, chat_doc_ids, messages, personality, user_id
            )

        # persist user message
        await create_message(data)
        await self.history_handler.add_message(chat_id, data, sid)

        # start AI message generation
        chat_model: Optional[str] = await get_chat_model(chat_id)
        logger.info(f"{chat_model=}")
        model_selection = ""
        if not chat_model:
            model_selection: str = await get_model_selection(user_id)
        sess = await self.get_session(sid, self.namespace)
        model = model_factory(
            chat_model or model_selection, sess.get("docs_token_count", 0)
        )
        if not chat_model:
            logger.info("updating chat model...")
            await set_chat_model(chat_id, model["model_name"])

        ctx = Context()
        tool_selection: list[str] = additional_data.get("personality", {}).get(
            "tools", []
        )
        ctx.question_pack = additional_data.get("question_pack")
        ctx.document_pack = additional_data.get("document_pack")
        tools = bootstrap_tools(ctx=ctx, tool_names=tool_selection)
        app = await build_graph(model["model_impl"], tools, chat_id)  # type: ignore
        messages.append(data)
        resp = new_server_message(chat_id, user_id)
        if (
            messages[0]["role"] == "system"
            and model["model_name"] == "claude-3-5-sonnet-20241022"
        ):
            logger.info(
                "antrophic model detected, will convert system message to user message"
            )
            messages[0]["role"] = "user"
        stream_future = self.stream_response(app, messages, resp, chat_id)
        await self.task_runner(
            sid,
            stream_future,
            chat_id,
            resp,
            calculate_faithfullness=additional_data.get("detect_hallucination", False),
            faithfullness_params=FaithfullnessParams(
                ctx=ctx,
                user_message="".join(
                    map(
                        lambda x: x["data"],
                        filter(lambda x: x["logicalType"] == "text", data["content"]),
                    )
                ),
                llm=model["model_impl"],
            ),
        )
        # finalize and wrap things up
        if additional_data.get("first_message"):
            print("messages", messages)
            # create automatic chat title
            title = await create_chat_title(
                model, [convert_to_langchain_message(messages[1]), convert_to_langchain_message(resp)]  # type: ignore
            )  # exclude system message
            await update_chat_title(chat_id, title)
            await self.emit(
                "autogen_chat_title",
                {"new_title": title, "chat_id": chat_id, "user_id": user_id},
                to=sid,  # the person who created the chat should get this
                namespace=self.namespace,
            )

    async def on_join_chat_room(self, sid: str, data: dict[str, Any]):
        logger.info(f"{sid} requesting to join chat room {data['room_id']}")
        await self._room_resolver(sid, data["room_id"])

    async def _create_chat(self, chat_id: str, user_id: str, sid: str):
        await create_chat(chat_id, user_id)
        await self.save_session(
            sid, {"chat_id": chat_id, "user_id": user_id}, namespace=self.namespace
        )

    async def _room_resolver(self, sid, chat_id):
        rooms = self.rooms(sid, self.namespace)
        if not rooms or chat_id not in rooms:
            await self.enter_room(sid, chat_id, self.namespace)

    async def _first_message_handler(
        self,
        sid: str,
        chat_doc_ids: list[str],
        instruction: str,
        personality_doc_ids: Optional[list[str]],
        chat_id: str,
        personality: dict[str, Any],
        messages: list[Message],
        user_id: str,
    ):
        logger.info("saving doc ids to session...")
        current_sess = await self.get_session(sid, self.namespace)
        current_sess["docs"] = set(chat_doc_ids)
        current_sess["docs_token_count"] = await get_doc_tokens(chat_doc_ids)
        await self.save_session(sid, current_sess, self.namespace)
        logger.info("creating system message...")
        system_message_content = instruction
        doc_contents = await asyncio.gather(
            read_docs_helper(personality_doc_ids),
            read_docs_helper(chat_doc_ids),
        )
        docs = "\n\n".join(doc_contents) if personality_doc_ids or chat_doc_ids else ""
        system_message_content = (
            f"{instruction}\n\nDOCUMENTS:\n\n{docs}" if len(docs) > 0 else instruction
        )
        system_message = build_system_message(system_message_content, chat_id, user_id)
        await self.history_handler.add_system_message(chat_id, system_message)
        messages.append(system_message)
        create_message_future = create_message(system_message)
        update_chat_future = update_chat(chat_id, personality, chat_doc_ids)
        await asyncio.gather(create_message_future, update_chat_future)

    async def _additional_docs_handler(
        self,
        sid: str,
        chat_id: str,
        chat_doc_ids: list[str],
        messages: list[Message],
        personality: dict[str, str],
        user_id: str,
    ):
        sess = await self.get_session(sid, self.namespace)
        existing_docs = sess.get("docs")
        # we need to double check with db
        if not existing_docs:
            existing_docs: set[str] = await get_chat_docs(chat_id)
        current_docs: set[str] = set(chat_doc_ids)
        diff: set[str] = current_docs - existing_docs
        if len(diff):
            sess["docs"] = set(chat_doc_ids)
            sess["docs_token_count"] = await get_doc_tokens(chat_doc_ids)
            await self.save_session(sid, sess, self.namespace)
            logger.info(f"received new docs: {diff}")
            new_content = await read_docs_helper(diff)  # type: ignore
            new_system_message_content = f"You are given the below additional documents as context.\n\nADDITIONAL DOCUMENTS:\n\n{new_content}"
            new_system_message = build_system_message(
                new_system_message_content, chat_id, user_id
            )
            messages.append(new_system_message)
            create_message_future = create_message(new_system_message)
            update_chat_future = update_chat(chat_id, personality, chat_doc_ids)
            await asyncio.gather(create_message_future, update_chat_future)
            await self.history_handler.add_system_message(chat_id, new_system_message)
