from collections import defaultdict
from typing import Any, AsyncGenerator, Literal, Optional, cast
from jarvis.chat.chat_title import create_chat_title
from jarvis.context.context import FaithfullnessParams
from jarvis.graphrag.graphrag import query_documents
import logging
from dotenv import load_dotenv
from jarvis.graphrag.workflow import execute_workflow
from jarvis.messages.type import Message, TextContent
from jarvis.messages.utils import (
    build_system_message,
    convert_to_langchain_message,
    new_server_message,
)
from jarvis.models import ALL_SUPPORTED_MODELS
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
from langchain_core.messages import AIMessage, HumanMessage


load_dotenv()

logger = logging.getLogger(__name__)


class GenerationManager:
    generation_queue: defaultdict[str, asyncio.Queue] = defaultdict(
        lambda: asyncio.Queue(1)
    )

    def __init__(self, chat_id: str):
        self.chat_id = chat_id

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_value, exc_tb):
        try:
            self.generation_queue[self.chat_id].get_nowait()
        except asyncio.QueueEmpty:
            logger.warning(f"queue should not be empty - internal error")

    async def acquire_nowait(self) -> bool:
        try:
            self.generation_queue[self.chat_id].put_nowait(None)
            return True
        except asyncio.QueueFull:
            return False

    async def acquire(self):
        return await self.generation_queue[self.chat_id].put(None)


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

        run_manager = GenerationManager(chat_id)
        success = await run_manager.acquire_nowait()

        if not success:
            await self.emit(
                "server_message",
                {
                    "content": [TextContent(type="text", text="<queued>")],
                    "chatId": chat_id,
                },
            )
            await run_manager.acquire()
            await self.emit(
                "server_message",
                {
                    "content": [TextContent(type="text", text="<start>")],
                    "chatId": chat_id,
                },
            )

        # we can only one generation per chat, otherwise it's very racey
        async with run_manager:
            additional_data: dict[str, Any] = cast(dict[str, Any], data.get("data", {}))

            try:
                # create chat
                if additional_data.get("first_message"):
                    await self._create_chat(chat_id, user_id, sid)
            except Exception as err:
                return await self._emit_error(chat_id, f"failed to create chat: {err}")

            # broadcast message to other participants
            await self.emit(
                "chat_broadcast",
                data,
                room=chat_id,
                skip_sid=sid,
                namespace=self.namespace,
            )

            # check if we have the system prompt cached
            system_prompt = await self._check_system_prompt_cache(sid)
            cached_prompt_available = system_prompt is not None

            personality = additional_data.get("personality", {})
            logger.info(f"personality: {personality.get("name")}")
            chat_doc_ids: list[str] = additional_data.get("docs", [])

            try:
                # generate system prompt if no cached prompt available or if new docs are available and system prompt needs update
                if not cached_prompt_available or (
                    cached_prompt_available
                    and len(chat_doc_ids) > 0
                    and await self._additional_docs_available(
                        sid, chat_id, chat_doc_ids
                    )
                ):
                    system_prompt = await self._build_system_prompt(
                        sid,
                        chat_doc_ids,
                        personality,
                        chat_id,
                        user_id,
                    )
                    await self._persist_system_prompt(
                        sid,
                        system_prompt,
                        chat_id,
                        personality,
                        chat_doc_ids,
                    )
            except Exception as err:
                return await self._emit_error(
                    chat_id, f"failed to create system prompt: {err}"
                )

            try:
                # persist user message
                await create_message(data)
            except Exception as err:
                return await self._emit_error(
                    chat_id, f"failed to persist user message: {err}"
                )

            try:
                # start AI message generation
                chat_model: Optional[str] = await get_chat_model(chat_id)
            except Exception as err:
                return await self._emit_error(
                    chat_id, f"failed to get chat model: {err}"
                )
            # resolve LLM model
            logger.info(f"{chat_model=}")
            model_selection = ""
            try:
                # models get deprecated we need to check if it is still a viable model
                if not chat_model or chat_model not in ALL_SUPPORTED_MODELS:
                    model_selection: str = await get_model_selection(user_id)
                sess = await self.get_session(sid, self.namespace)
                model = model_factory(
                    chat_model or model_selection, sess.get("docs_token_count", 0)
                )
                if not chat_model:
                    logger.info("updating chat model...")
                    await set_chat_model(chat_id, model["model_name"])
            except Exception as err:
                return await self._emit_error(
                    chat_id, f"failed to resolve chat model: {err}"
                )
            try:
                # build necessary downstream context
                ctx = Context(
                    question_pack=additional_data.get("question_pack"),
                    document_pack=additional_data.get("document_pack"),
                    system_prompt=system_prompt,
                )
                tool_selection: list[str] = personality.get("tools", [])
                # wire up the relevant agent
                tools = bootstrap_tools(ctx=ctx, tool_names=tool_selection)
                app = await build_graph(model["model_impl"], tools, chat_id, ctx)
            except Exception as err:
                return await self._emit_error(chat_id, f"agent build failed: {err}")
            # we prepare for response generation
            messages = [data]
            resp = new_server_message(chat_id, user_id)
            stream_future = self.stream_response(app, messages, resp, chat_id)
            await self.task_runner(
                sid,
                stream_future,
                chat_id,
                resp,
                calculate_faithfullness=additional_data.get(
                    "detect_hallucination", False
                ),
                faithfullness_params=FaithfullnessParams(
                    ctx=ctx,
                    user_message="".join(
                        map(
                            lambda x: cast(TextContent, x)["text"],
                            filter(lambda x: x["type"] == "text", data["content"]),
                        )
                    ),
                    llm=model["model_impl"],
                ),
            )
        # finalize and wrap things up
        if additional_data.get("first_message"):
            try:
                # create automatic chat title
                title = await create_chat_title(
                    model,
                    [
                        cast(HumanMessage, convert_to_langchain_message(messages[-1])),
                        cast(AIMessage, convert_to_langchain_message(resp)),
                    ],
                )
                await update_chat_title(chat_id, title)
                await self.emit(
                    "autogen_chat_title",
                    {"new_title": title, "chat_id": chat_id, "user_id": user_id},
                    to=sid,  # the person who created the chat should get this
                    namespace=self.namespace,
                )
            except Exception as err:
                logger.error(f"failed to autogen chat title: {err}", exc_info=True)

    async def _emit_error(self, chat_id: str, err: Any):
        await self.emit(
            "server_message",
            {
                "content": [
                    TextContent(
                        type="text", text=f"failed to persist user message: {err}"
                    )
                ],
                "chatId": chat_id,
            },
            room=chat_id,
            namespace=self.namespace,
        )
        return await self.emit(
            "server_message",
            {
                "content": [TextContent(type="text", text="<done>")],
                "chatId": chat_id,
            },
            room=chat_id,
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

    async def _check_system_prompt_cache(self, sid: str) -> Optional[Message]:
        current_sess = await self.get_session(sid, self.namespace)
        return current_sess.get("system_message")

    async def _build_system_prompt(
        self,
        sid: str,
        chat_doc_ids: list[str],
        personality: dict[str, Any],
        chat_id: str,
        user_id: str,
    ) -> Optional[Message]:

        instruction: Optional[str] = personality.get("instructions")

        if not instruction:
            return None

        personality_doc_ids: Optional[list[str]] = personality.get("doc_ids")

        logger.info("saving doc ids to session...")
        current_sess = await self.get_session(sid, self.namespace)

        # build system prompt
        current_sess["docs"] = set(chat_doc_ids)
        current_sess["docs_token_count"] = await get_doc_tokens(chat_doc_ids)
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

        return system_message

    async def _persist_system_prompt(
        self,
        sid: str,
        system_message: Optional[Message],
        chat_id: str,
        personality: dict[str, Any],
        chat_doc_ids: list[str],
    ):
        if not system_message:
            return

        # persist in db
        create_message_future = create_message(system_message)
        update_chat_future = update_chat(chat_id, personality, chat_doc_ids)
        await asyncio.gather(create_message_future, update_chat_future)
        # persist in cache
        current_sess = await self.get_session(sid, self.namespace)
        current_sess["system_message"] = system_message
        await self.save_session(sid, current_sess, self.namespace)

    async def _additional_docs_available(
        self,
        sid: str,
        chat_id: str,
        chat_doc_ids: list[str],
    ) -> bool:
        sess = await self.get_session(sid, self.namespace)
        existing_docs = sess.get("docs")
        # we need to double check with db
        if not existing_docs:
            existing_docs: set[str] = await get_chat_docs(chat_id)
        current_docs: set[str] = set(chat_doc_ids)
        diff: set[str] = current_docs - existing_docs
        if len(diff):
            logger.info(f"{len(diff)} additional docs detected")
            return True
        return False
