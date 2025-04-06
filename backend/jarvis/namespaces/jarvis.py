import os
from uuid import uuid4
from jarvis.blob_storage.storage import must_list
from jarvis.chat.chat_title import create_chat_title
from jarvis.context.context import FaithfullnessParams
from jarvis.document_parsers.csv import process_csv
from jarvis.document_parsers.gemini import gemini_pdf_processor
from jarvis.document_parsers.llamaparse import document_handler
from jarvis.document_parsers.txt import process_txt
from jarvis.graphrag.graphrag import index_documents, query_documents
import logging
from dotenv import load_dotenv
import json
from jarvis.graphrag.preprocess import preprocess_docs
from jarvis.messages.utils import (
    build_system_message,
    build_user_message,
    new_server_message,
    skip_message,
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
    get_message_history,
    insert_doc,
    insert_doc_into_pack,
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
from pathlib import Path
import pandas as pd


load_dotenv()

logger = logging.getLogger(__name__)
DOCUMENT_BUCKET = os.getenv("DOCUMENT_BUCKET")
assert DOCUMENT_BUCKET, "DOCUMENT_BUCKET is not set!"


class Jarvis(Base):
    async def on_join_pack_room(self, sid, data):
        logger.info(f"{sid} requesting to join room for pack {data['room_id']}")
        rooms = self.rooms(sid, self.namespace)
        if data["room_id"] not in rooms:
            await self.enter_room(sid, data["room_id"], self.namespace)

    async def on_build_document_pack(self, sid, data):
        try:
            rooms = self.rooms(sid, self.namespace)
            if data["pack_id"] not in rooms: 
                await self.enter_room(sid, data["pack_id"], self.namespace)
            await update_document_pack_status(data["pack_id"], "parsing")
            await self.emit("workflow_update", {"stage": "parsing"}, room=data["pack_id"])
            res = await self._parse_docs(data)
            if res == "fail":
                await update_document_pack_status(data["pack_id"], "fail")
                await self.emit("workflow_update", {"stage": "fail"}, room=data["pack_id"])
                return "fail"
            else:
                await update_document_pack_status(data["pack_id"], "preprocessing")
                await self.emit("workflow_update", {"stage": "preprocessing"}, room=data["pack_id"])
            res = await self._preprocess_docs(data)
            if res == "fail":
                await update_document_pack_status(data["pack_id"], "fail")
                await self.emit("workflow_update", {"stage": "fail"}, room=data["pack_id"])
                return "fail"
            else: 
                await update_document_pack_status(data["pack_id"], "indexing")
                await self.emit("workflow_update", {"stage": "indexing"}, room=data["pack_id"])
            res = await self._index_docs(data)
            if res == "fail":
                await update_document_pack_status(data["pack_id"], "fail")
                await self.emit("workflow_update", {"stage": "fail"}, room=data["pack_id"])
                return "fail"
            else: 
                await self.emit("workflow_update", {"stage": "done"}, room=data["pack_id"])
            await update_document_pack_status(data["pack_id"], "done")
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

    async def _parse_docs(self, data):
        try:
            source_path = f"document_packs/{data['pack_id']}/raw"
            logger.info(f"parsing docs: {source_path}...")
            blobs = await must_list(
                os.getenv("GOOGLE_PROJECT"), DOCUMENT_BUCKET, source_path
            )
            doc_paths = [f"{DOCUMENT_BUCKET}/{blob}" for blob in blobs]
            logger.info(f"found docs: {doc_paths}")

            futures = []
            for source_path in doc_paths:
                target_path = source_path.replace("/raw/", "/parsed/")
                # gemini processor scales better
                futures.append(
                    gemini_pdf_processor(
                        source_path,
                        target_path,
                    )
                )
            await asyncio.gather(*futures)
            return "done"
        except Exception as err:
            logger.error(f"failed to parse docs: {err}", exc_info=True)
            return "fail"

    async def _preprocess_docs(self, data):
        # graph rag does not support markdown well at the moment, so we need to preprocess the data

        try:
            source_path = f"document_packs/{data['pack_id']}/parsed"
            logger.info(f"preprocessing docs: {source_path}...")
            blobs = await must_list(
                os.getenv("GOOGLE_PROJECT"), DOCUMENT_BUCKET, source_path
            )
            doc_paths = [f"{DOCUMENT_BUCKET}/{blob}" for blob in blobs]
            logger.info(f"found docs: {doc_paths}")

            futures = []
            for source_path in doc_paths:
                target_path = source_path.replace("/parsed/", "/preprocessed/")
                futures.append(preprocess_docs(source_path, target_path))

            await asyncio.gather(*futures)
            return "done"
        except Exception as err:
            logger.error(f"failed to preprocess docs: {err}", exc_info=True)
            return "fail"

    async def _index_docs(self, data):
        try:
            logger.info(f"indexing docs with pack id: {data['pack_id']}...")
            await index_documents(data["pack_id"], DOCUMENT_BUCKET)
            logger.info("indexing done")
            logger.info("inserting docs into db")
            root = Path(f"/tmp/jarvis/{data['pack_id']}")
            documents_pq = root / "output/documents.parquet"
            documents = pd.read_parquet(documents_pq, columns=["id", "title"]).to_dict(
                orient="records"
            )
            for doc in documents:
                await insert_doc_into_pack(doc["title"], data["pack_id"], doc["id"])
            logger.info("done inserting docs")
            return "done"
        except Exception as err:
            logger.error(f"failed to index docs: {err}", exc_info=True)
            return "fail"

    async def on_document_upload_complete(self, sid, data):
        try:
            logger.info(f"received document {data['name']} for user {data['user']}")
            # .csv,.txt,.pdf,.xlsx supported
            if (
                not data["name"].lower().endswith(".csv")
                and not data["name"].lower().endswith(".txt")
                and not data["name"].lower().endswith(".pdf")
                and not data["name"].lower().endswith(".xlsx")
            ):
                return {"result": "unknown document type"}
            if data["name"].lower().endswith(".txt"):
                logger.info("processing txt file...")
                source_path = f"{DOCUMENT_BUCKET}/raw/{data['user']}/{data['uploadId']}/{data['name']}"
                target_path = source_path.replace("raw", "parsed") + ".md"
                num_pages, num_tokens = await asyncio.to_thread(
                    process_txt, src_path=source_path, target_path=target_path
                )
            elif data["name"].lower().endswith(".csv"):
                logger.info("processing csv file...")
                source_path = f"gs://{DOCUMENT_BUCKET}/raw/{data['user']}/{data['uploadId']}/{data['name']}"
                target_path = source_path.replace("raw", "parsed") + ".md"
                num_pages, num_tokens = await asyncio.to_thread(
                    process_csv, src_path=source_path, target_path=target_path
                )
            elif data["name"].lower().endswith(".pdf"):
                if data.get("mode", "accurate") == "fast":
                    logger.info("fast pdf processing mode selected")
                    source_path = f"{DOCUMENT_BUCKET}/raw/{data['user']}/{data['uploadId']}/{data['name']}"
                    target_path = source_path.replace("raw", "parsed") + ".md"
                    num_pages, num_tokens = await gemini_pdf_processor(
                        source_path, target_path
                    )
                else:
                    logger.info("accurate pdf processing mode selected")
                    source_path = f"{DOCUMENT_BUCKET}/raw/{data['user']}/{data['uploadId']}/{data['name']}"
                    target_path = source_path.replace("raw", "parsed") + ".md"
                    num_pages, num_tokens = await asyncio.to_thread(
                        document_handler,
                        src_path=source_path,
                        target_path=target_path,
                        use_premium_mode=True,
                    )
            else:  # .xlsx
                logger.info("processing file...")
                source_path = f"{DOCUMENT_BUCKET}/raw/{data['user']}/{data['uploadId']}/{data['name']}"
                target_path = source_path.replace("raw", "parsed") + ".md"
                num_pages, num_tokens = await asyncio.to_thread(
                    document_handler,
                    src_path=source_path,
                    target_path=target_path,
                    use_premium_mode=True,
                )
            logger.info("inserting doc into db")
            await insert_doc(
                data["uploadId"], data["name"], data["user"], num_pages, num_tokens
            )
            logger.info("document processing done")
            return {
                "result": f"document_done_{data['name']}_{data['user']}",
                "num_pages": num_pages,
                "num_tokens": num_tokens,
            }
        except Exception as err:
            logger.error(f"document processing failed: {err}", exc_info=True)
            return {"result": "document processing failed"}

    async def on_chat_message(self, sid, data):
        logger.info(f"received message: {data['content']}")
        d = json.loads(data["data"])
        chat_id, user_id = d["chat_id"], d["user_id"]
        # create chat
        if d.get("first_message"):
            await self._create_chat(chat_id, user_id, sid)
        # create chat room
        await self._room_resolver(sid, chat_id)
        # broadcast message to other participants
        await self.emit(
            "chat_broadcast", data, room=chat_id, skip_sid=sid, namespace=self.namespace
        )

        # generate system prompt if necessary
        messages = []
        logger.info(f"personality: {d.get('personality', {}).get("name")}")
        instruction = d.get("personality", {}).get("instructions")
        chat_doc_ids = d.get("docs", [])
        personality_doc_ids = d.get("personality", {}).get("doc_ids")

        # this is the first message
        if d.get("first_message") and instruction:
            personality = d.get("personality", {})
            await self._first_message_handler(
                sid,
                chat_doc_ids,
                instruction,
                personality_doc_ids,
                chat_id,
                personality,
                messages,
            )

        # we need to check if we received additional docs
        if not d.get("first_message") and len(chat_doc_ids) > 0:
            personality = d.get("personality", {})
            await self._additional_docs_handler(
                sid, chat_id, chat_doc_ids, messages, personality
            )

        # persist user message
        await create_message(data, chat_id)
        if skip_message(data["content"]):
            logger.info("message for @self skipping...")
            return await self.emit(
                "server_message",
                {"content": "<done>", "data": json.dumps({"chat_id": chat_id})},
                room=chat_id,
                namespace=self.namespace,
            )

        # start AI message generation
        chat_model = await get_chat_model(chat_id)
        logger.info(f"{chat_model=}")
        if not chat_model:
            model_selection = await get_model_selection(user_id)
        sess = await self.get_session(sid, self.namespace)
        model = model_factory(
            chat_model or model_selection, sess.get("docs_token_count", 0)
        )
        if not chat_model:
            logger.info("updating chat model...")
            await set_chat_model(chat_id, model["model_name"])

        ctx = Context()
        tool_selection = d.get("personality", {}).get("tools", [])
        ctx.question_pack = d.get("question_pack")
        ctx.document_pack = d.get("document_pack")
        tools = bootstrap_tools(ctx=ctx, tool_names=tool_selection)
        app = await build_graph(model["model_impl"], tools, chat_id)
        messages.extend(build_user_message(data))
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
            stream_future,
            chat_id,
            resp,
            calculate_faithfullness=d.get("detect_hallucination"),
            faithfullness_params=FaithfullnessParams(
                ctx=ctx,
                user_message=data["content"],
                llm=model["model_impl"],
            ),
        )
        # finalize and wrap things up
        if d.get("first_message"):
            # create automatic chat title
            title = await create_chat_title(
                model, [messages[1]["content"], resp.content]
            )  # exclude system message
            await update_chat_title(chat_id, title)
            await self.emit(
                "autogen_chat_title",
                {"new_title": title, "chat_id": chat_id, "user_id": user_id},
                to=sid,
                namespace=self.namespace,
            )

    async def on_generate_chat_title(self, sid, data):
        try:
            chat_id = data.get("chat_id")
            [chat_model, history] = await asyncio.gather(
                get_chat_model(chat_id), get_message_history(chat_id)
            )
            model = model_factory(chat_model, 0)
            title = await create_chat_title(model, history)
            await update_chat_title(chat_id, title)
            return True
        except Exception as err:
            logger.error(f"failed to create chat title: {err}", exc_info=True)
            return False

    async def _create_chat(self, chat_id, user_id, sid):
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
        sid,
        chat_doc_ids,
        instruction,
        personality_doc_ids,
        chat_id,
        personality,
        messages,
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
        system_message_content = f"{instruction}\n\nDOCUMENTS:\n\n{docs}"
        system_message = build_system_message(system_message_content)
        messages.append(system_message)
        create_message_future = create_message(
            {
                "id": str(uuid4()),
                "content": system_message_content,
                "chat_id": chat_id,
                "role": "system",
                "data": json.dumps({}),
            },
            chat_id,
        )
        update_chat_future = update_chat(chat_id, personality, chat_doc_ids)
        await asyncio.gather(create_message_future, update_chat_future)

    async def _additional_docs_handler(
        self, sid, chat_id, chat_doc_ids, messages, personality
    ):
        sess = await self.get_session(sid, self.namespace)
        existing_docs = sess.get("docs")
        # we need to double check with db
        if not existing_docs:
            existing_docs = await get_chat_docs(chat_id)
        current_docs = set(chat_doc_ids)
        diff = current_docs - existing_docs
        if len(diff):
            sess["docs"] = set(chat_doc_ids)
            sess["docs_token_count"] = await get_doc_tokens(chat_doc_ids)
            await self.save_session(sid, sess, self.namespace)
            logger.info(f"received new docs: {diff}")
            new_content = await read_docs_helper(diff)
            new_system_message_content = f"You are given the below additional documents as context.\n\nADDITIONAL DOCUMENTS:\n\n{new_content}"
            new_system_message = build_system_message(new_system_message_content)
            messages.append(new_system_message)
            create_message_future = create_message(
                {
                    "id": str(uuid4()),
                    "content": new_system_message_content,
                    "chat_id": chat_id,
                    "role": "system",
                    "data": json.dumps({}),
                },
                chat_id,
            )
            update_chat_future = update_chat(chat_id, personality, chat_doc_ids)
            await asyncio.gather(create_message_future, update_chat_future)
