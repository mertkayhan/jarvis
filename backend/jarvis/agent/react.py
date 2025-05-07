from __future__ import annotations
from langchain_anthropic import ChatAnthropic
from langchain_core.language_models.chat_models import BaseChatModel
from langchain.tools import Tool
from typing import (
    Annotated,
    Any,
    Awaitable,
    Callable,
    Dict,
    List,
    Literal,
    Sequence,
    TypedDict,
    Union,
)
from langchain_core.messages import BaseMessage, ToolMessage
from langchain_google_vertexai import ChatVertexAI
from langchain_openai import ChatOpenAI
from langgraph.graph.message import add_messages
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, END
import asyncio
from langgraph.graph.state import CompiledStateGraph


class AgentState(TypedDict):
    """The state of the agent."""

    # add_messages is a reducer
    # See https://langchain-ai.github.io/langgraph/concepts/low_level/#reducers
    messages: Annotated[Sequence[BaseMessage], add_messages]


async def tool_call_handler(
    fun: Callable[[Any], Awaitable[Union[Dict[str, Any] ,str]]], context: Dict[str, Any], model: str
) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
    res = await fun(context["args"])
    if not isinstance(res, (str, dict)):
        raise TypeError("Expected str or list result from tool")
    if isinstance(res, str):
        return {
            "role": "tool",
            "content": res, 
            "tool_call_id": context["id"],
            "name": context["name"],
        }

    if model == "antrophic":
        res["role"] = "tool"
        res["name"] = context["name"]
        res["tool_call_id"] = context["id"]
    elif model == "google":
        res["role"] = "user"
    elif model == "openai":
        res["role"] = "user"
        return [
            {
                "role": "tool",
                "content": "You will find the actual tool response in the following message",
                "tool_call_id": context["id"],
                "name": context["name"],
            },
            res,
        ]
    else:
        raise NotImplementedError

    return res


def flatten(x: List):
    flat = []
    for element in x:
        if isinstance(element, list):
            flat.extend(element)
        else:
            flat.append(element)
    return flat


# Define our tool node
async def tool_node(
    state: AgentState, tools_by_name: Dict[str, Tool], model: str
) -> Dict[str, List[ToolMessage]]:

    # print("tool calls:", state["messages"][-1].tool_calls)
    tool_calls = [] if not hasattr(state["messages"][-1], "tool_calls") else state["messages"][-1].tool_calls  # type: ignore
    outputs = await asyncio.gather(
        *[
            tool_call_handler(
                tools_by_name[tool_call["name"]].ainvoke, tool_call, model
            )
            for tool_call in tool_calls
        ],
    )

    flat_outputs = flatten(outputs)

    # this is a band-aid to make the above work around work - otherwise we cannot add images into tool responses
    if len(outputs) > 1:
        # we need to group user messages into one
        user_message_content = []
        for msg in flat_outputs:
            if isinstance(msg, dict) and msg.get("role") == "user":
                user_message_content.extend(msg["content"])
        if len(user_message_content) > 0:
            tool_messages = [msg for msg in flat_outputs if isinstance(msg, dict) and msg.get("role") == "tool"]
            flat_outputs = tool_messages + [
                {"role": "user", "content": user_message_content}
            ]

    # print("outputs:", flat_outputs)
    return {"messages": flat_outputs}  # type: ignore


# Define the node that calls the model
async def call_model(
    state: AgentState, config: RunnableConfig, model: BaseChatModel
) -> Dict[str, List[BaseMessage]]:
    # this is similar to customizing the create_react_agent with 'prompt' parameter, but is more flexible
    # TODO: add system prompt explicitly
    # system_prompt = SystemMessage(
    #     "You are a helpful AI assistant, please respond to the users query to the best of your ability!"
    # )
    # response = model.invoke([system_prompt] + state["messages"], config)
    # TODO: handle chat history compaction here
    res = await model.ainvoke(state["messages"], config)
    # We return a list, because this will get added to the existing list
    return {"messages": [res]}


# Define the conditional edge that determines whether to continue or not
def should_continue(state: AgentState) -> Literal["end"] | Literal["continue"]:
    messages = state["messages"]
    last_message = messages[-1]
    # If there is no function call, then we finish
    if not last_message.tool_calls:  # type: ignore
        return "end"
    # Otherwise if there is, we continue
    else:
        return "continue"


def build_react_chatbot(
    llm: BaseChatModel, mem, tools: Sequence[Tool], chat_id: str
) -> CompiledStateGraph:
    if isinstance(llm, ChatOpenAI):
        model = "openai"
    elif isinstance(llm, ChatAnthropic):
        model = "antrophic"
    elif isinstance(llm, ChatVertexAI):
        model = "google"
    else:
        raise TypeError("Unsupported LLM type")

    llm = llm.bind_tools(tools)  # type: ignore
    tools_by_name = {tool.name: tool for tool in tools}

    async def tool_node_partial(state: AgentState) -> Dict[str, List]:
        return await tool_node(state, tools_by_name, model)

    async def call_model_partial(
        state: AgentState, config: RunnableConfig
    ) -> Dict[str, List[BaseMessage]]:
        return await call_model(state, config, llm)

    # Define a new graph
    workflow = StateGraph(AgentState)

    # Define the two nodes we will cycle between
    workflow.add_node("agent", call_model_partial)
    workflow.add_node("tools", tool_node_partial)

    # Set the entrypoint as `agent`
    # This means that this node is the first one called
    workflow.set_entry_point("agent")

    # We now add a conditional edge
    workflow.add_conditional_edges(
        # First, we define the start node. We use `agent`.
        # This means these are the edges taken after the `agent` node is called.
        "agent",
        # Next, we pass in the function that will determine which node is called next.
        should_continue,
        # Finally we pass in a mapping.
        # The keys are strings, and the values are other nodes.
        # END is a special node marking that the graph should finish.
        # What will happen is we will call `should_continue`, and then the output of that
        # will be matched against the keys in this mapping.
        # Based on which one it matches, that node will then be called.
        {
            # If `tools`, then we call the tool node.
            "continue": "tools",
            # Otherwise we finish.
            "end": END,
        },
    )

    # We now add a normal edge from `tools` to `agent`.
    # This means that after `tools` is called, `agent` node is called next.
    workflow.add_edge("tools", "agent")

    # Now we can compile and visualize our graph
    graph = workflow.compile(checkpointer=mem.saver).with_config(
        {"configurable": {"thread_id": chat_id}}
    )
    return graph
