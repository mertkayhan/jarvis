from __future__ import annotations
from typing import Annotated, Optional, Union
from jarvis.agent.utils import Memory
from jarvis.context.context import Context
from jarvis.messages.type import Message
from jarvis.messages.utils import convert_to_langchain_message
from langchain_anthropic import ChatAnthropic
from langchain_core.messages.base import BaseMessage
from langchain_google_vertexai import ChatVertexAI
from langchain_openai import ChatOpenAI
from langgraph.graph.state import CompiledStateGraph
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages


class State(TypedDict):
    # Messages have the type "list". The `add_messages` function
    # in the annotation defines how this state key should be updated
    # (in this case, it appends messages to the list, rather than overwriting them)
    messages: Annotated[list, add_messages]


def build_basic_chatbot(
    llm: Union[ChatOpenAI, ChatVertexAI, ChatAnthropic],
    memory: Memory,
    chat_id: str,
    ctx: Context,
) -> CompiledStateGraph:
    graph_builder = StateGraph(State)

    def chatbot(state: State) -> dict[str, list[BaseMessage]]:
        s = (
            [convert_to_langchain_message(ctx.system_prompt)]
            if ctx.system_prompt
            else []
        )
        return {"messages": [llm.invoke(s + state["messages"])]}

    # The first argument is the unique node name
    # The second argument is the function or object that will be called whenever
    # the node is used.
    graph_builder.add_node("chatbot", chatbot)
    graph_builder.add_edge(START, "chatbot")
    graph_builder.add_edge("chatbot", END)
    graph = graph_builder.compile(checkpointer=memory.saver).with_config(
        {"configurable": {"thread_id": chat_id}}
    )
    return graph
