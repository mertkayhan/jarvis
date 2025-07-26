from __future__ import annotations
from typing import AsyncGenerator, Dict, Optional, Sequence, Union
import logging
from typing import TypedDict
from jarvis.agent.utils import Memory
from jarvis.context.context import Context
from jarvis.messages.type import Message
from langchain_anthropic import ChatAnthropic
from langchain_google_vertexai import ChatVertexAI
from langchain_openai import ChatOpenAI
from langgraph.graph.state import CompiledStateGraph
from langchain.tools import StructuredTool
from .basic import build_basic_chatbot
from .react import build_react_chatbot
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
load_dotenv()


async def build_graph(
    llm: Union[ChatOpenAI, ChatVertexAI, ChatAnthropic],
    tools: Sequence[StructuredTool],
    chat_id: str,
    ctx: Context,
) -> CompiledStateGraph:
    mem = Memory()
    if not mem.saver:
        await mem.setup()
    await mem.check()
    if len(tools) > 0:
        logger.info("creating react agent")
        agent_executor = build_react_chatbot(llm, mem, tools, chat_id, ctx)
    else:
        logger.info("creating basic chatbot")
        agent_executor = build_basic_chatbot(llm, mem, chat_id, ctx)
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
        # print("event:", event)
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
