from __future__ import annotations
from typing import Coroutine, Dict, List, Union, Optional
from langchain_openai import ChatOpenAI
import socketio
from jarvis.auth.auth import validate_token
from jarvis.context import Context
from jarvis.context.context import FaithfullnessParams
from jarvis.messages.type import Message
from jarvis.queries.query_handlers import create_message
import logging
from dotenv import load_dotenv
import json
import asyncio
from abc import ABC, abstractmethod
from jarvis.agent.base import runner
from langgraph.graph.graph import CompiledGraph
from dataclasses import asdict
from ragas import SingleTurnSample
from ragas.metrics import Faithfulness
from ragas.llms import LangchainLLMWrapper
from copy import deepcopy


load_dotenv()

logger = logging.getLogger(__name__)


class Base(socketio.AsyncNamespace, ABC):
    model_name = "gpt-4o"

    @abstractmethod
    async def on_chat_message(self, sid, data):
        raise NotImplementedError()

    async def on_connect(self, sid, environ, auth):
        if not auth or not auth.get("user_id") or not auth.get("token"):
            return False
            # raise ConnectionRefusedError('authentication failed')
        try:
            await asyncio.to_thread(validate_token, token=auth.get("token"))
        except Exception as err:
            logger.error(f"Error during token validation: {err}", exc_info=True)
            return False
        logger.debug(f"Connect {auth}")
        return True

    async def on_abort(self, sid, data):
        logger.debug(f"abort {json.dumps(data)}")
        room_id = data  # json.loads(data["data"])["chat_id"]
        task = [task for task in asyncio.all_tasks() if task.get_name() == room_id]
        if len(task) == 0:
            return await self.emit(
                "abort", "no task found", room=room_id, namespace=self.namespace
            )
        ok = task[0].cancel()
        logger.debug(f"cancel: {ok}")
        return await self.emit("abort", "OK", room=room_id, namespace=self.namespace)

    async def on_disconnect(self, sid):
        logger.debug("disconnect ", sid)
        sess = await self.get_session(sid, namespace=self.namespace)
        logger.debug("sess", sess)
        rooms = self.rooms(sid, self.namespace)
        for room in rooms:
            await self.leave_room(sid, room, namespace=self.namespace)

    async def stream_response(
        self,
        app: CompiledGraph,
        messages: Union[str, List[Dict]],
        resp: Message,
        chat_id: str,
    ):
        async for chunk in runner(
            app,
            {"messages": messages},
            event_name=chat_id,
        ):
            if isinstance(chunk["data"], str):
                if (
                    chunk["type"]["logical_type"] == "on_tool_start"
                    and len(resp.content) > 0
                ):
                    resp.content += "\n" + chunk["data"]
                else:
                    resp.content += chunk["data"]
            elif isinstance(chunk["data"], list) and "text" in chunk["data"][0]:
                resp.content += chunk["data"][0]["text"]
            await self.emit(
                "server_message",
                asdict(resp),
                room=chat_id,
                namespace=self.namespace,
            )

    async def calculate_faithfullness(
        self,
        ctx: Context,
        user_message: str,
        resp: Message,
        chat_id: str,
        llm: ChatOpenAI,
    ):
        retrieved_context = [o.page_content async for c in ctx for o in c.tool_output]
        sample = SingleTurnSample(
            user_input=user_message,
            retrieved_contexts=retrieved_context,
            response=resp.content,
        )
        scorer = Faithfulness(llm=LangchainLLMWrapper(llm))
        score = await scorer.single_turn_ascore(sample)
        resp.score = score * 100
        await self.emit(
            "server_message",
            asdict(resp),
            room=chat_id,
            namespace=self.namespace,
        )

    async def task_runner(
        self,
        stream_future: Coroutine,
        chat_id: str,
        resp: Message,
        calculate_faithfullness: bool = False,
        faithfullness_params: Optional[FaithfullnessParams] = None,
    ):
        try:
            task = asyncio.create_task(stream_future, name=chat_id)
            await task
            if calculate_faithfullness and faithfullness_params["ctx"].size > 0:
                logger.info("need to calculate context faithfullness")
                ctx_copy = deepcopy(faithfullness_params["ctx"])
                await self.calculate_faithfullness(
                    ctx_copy,
                    faithfullness_params["user_message"],
                    resp,
                    chat_id,
                    faithfullness_params["llm"],
                )
            msg_context = None
            if faithfullness_params and faithfullness_params["ctx"]:
                msg_context = await faithfullness_params["ctx"].to_json()
                resp.context = msg_context
                await self.emit(
                    "server_message",
                    asdict(resp),
                    room=chat_id,
                    namespace=self.namespace,
                )
            await create_message(
                {
                    "id": resp.id,
                    "content": resp.content,
                    "chat_id": chat_id,
                    "role": resp.role,
                    "data": resp.data,
                    "score": resp.score,
                    "context": msg_context,
                },
                chat_id,
            )
            logger.info("task done")
        except asyncio.CancelledError:
            logger.info("Successfully cancelled task")
        except Exception as err:
            logger.error(f"Unexpected error: {err}", exc_info=True)
            resp.content = f"Internal error: {err}.\n\n**Please include this error message when reporting the error.**"
            await self.emit(
                "server_message", asdict(resp), room=chat_id, namespace=self.namespace
            )
        finally:
            return await self.emit(
                "server_message",
                {"content": "<done>", "data": json.dumps({"chat_id": chat_id})},
                room=chat_id,
                namespace=self.namespace,
            )
