from __future__ import annotations
from typing import AsyncGenerator, Dict, Sequence
import logging
from typing import TypedDict
from langchain_openai import ChatOpenAI
from langgraph.graph.state import CompiledStateGraph
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langchain.tools import Tool

from jarvis.db.db import check_connection_pool, get_connection_pool
from .basic import build_basic_chatbot
from .react import build_react_chatbot
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
load_dotenv()


class Memory:
    saver = None

    @classmethod
    async def setup(cls):
        logger.info("setting up memory")
        pool = await get_connection_pool()
        cls.saver = AsyncPostgresSaver(pool)  # type: ignore
        await cls.saver.setup()

    @classmethod
    async def check(cls):
        logger.info("checking db connections...")
        await check_connection_pool()


async def build_graph(
    llm: ChatOpenAI, tools: Sequence[Tool], chat_id: str
) -> CompiledStateGraph:
    mem = Memory()
    if not mem.saver:
        await mem.setup()
    await mem.check()
    if len(tools) > 0:
        logger.info("creating react agent")
        agent_executor = build_react_chatbot(llm, mem, tools, chat_id)
    else:
        logger.info("creating basic chatbot")
        agent_executor = build_basic_chatbot(llm, mem, chat_id)
    return agent_executor


class StreamData(TypedDict):
    type: StreamType
    data: str


class StreamType(TypedDict):
    logical_type: str
    type: str


async def runner(
    app: CompiledStateGraph, input: Dict, event_name: str
) -> AsyncGenerator[StreamData]:
    async for event in app.astream_events(
        input, config={"configurable": {"thread_id": event_name}}
    ):
        print("event:", event)
        kind = event["event"]
        if kind == "on_chat_model_stream":
            content = event["data"]["chunk"].content  # type: ignore
            # logger.info(f"on_chat_model_stream - {content}")
            if content:
                yield StreamData(
                    data=content,
                    type=StreamType(logical_type="on_chat_model_stream", type="agent"),
                )
        elif kind == "on_tool_start":
            name = event["name"]
            args = event["data"].get("input", {})
            args_str = "; ".join([f"{key}={value}" for key, value in args.items()])
            yield StreamData(
                data=f"**Tool invocation**: {name} <- ```{args_str}```\n\n",
                type=StreamType(logical_type="on_tool_start", type="tools"),
            )

        elif kind == "on_tool_end":
            logger.info(f"Done tool: {event['name']}")
    logger.info("Runner done")
