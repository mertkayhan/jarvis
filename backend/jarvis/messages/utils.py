from typing import Any, Union, cast
from uuid import uuid4
from datetime import datetime
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from jarvis.messages.type import Message, TextContent


def new_server_message(chat_id: str, user_id: str) -> Message:
    return Message(
        id=str(uuid4()),
        createdAt=datetime.now().isoformat(),
        content=[TextContent(type="text", text="")],
        chatId=chat_id,
        userId=user_id,
        role="assistant",
        score=None,
        liked=None,
        context=None,
        data=None,
    )


def build_system_message(instruction: str, chat_id: str, user_id: str) -> Message:
    return Message(
        id=str(uuid4()),
        createdAt=datetime.now().isoformat(),
        content=[TextContent(type="text", text=instruction)],
        chatId=chat_id,
        userId=user_id,
        role="system",
        score=None,
        liked=None,
        context=None,
        data=None,
    )


def convert_to_langchain_message(
    msg: Message,
) -> Union[AIMessage, HumanMessage, SystemMessage, ToolMessage]:
    if msg["role"] == "assistant":
        return AIMessage(content=msg["content"])  # type: ignore
    elif msg["role"] == "user":
        return HumanMessage(content=msg["content"])  # type: ignore
    elif msg["role"] == "tool":
        return ToolMessage(content=msg["content"])  # type: ignore
    return SystemMessage(content=msg["content"])  # type: ignore
