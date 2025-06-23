from typing import Union
from uuid import uuid4
from datetime import datetime
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from jarvis.messages.type import Message, MessageContent


def new_server_message(chat_id: str, user_id: str) -> Message:
    return Message(
        id=str(uuid4()),
        createdAt=datetime.now().isoformat(),
        content=[MessageContent(logicalType="text", data="")],
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
        content=[MessageContent(logicalType="text", data=instruction)],
        chatId=chat_id,
        userId=user_id,
        role="system",
        score=None,
        liked=None,
        context=None,
        data=None,
    )


def langchain_content_mapper(content: list[MessageContent]) -> list[dict[str, str]]:
    return [{"type": c["logicalType"], c["logicalType"]: c["data"]} for c in content]


def convert_to_langchain_message(
    msg: Message,
) -> Union[AIMessage, HumanMessage, SystemMessage, ToolMessage]:
    if msg["role"] == "assistant":
        return AIMessage(content=langchain_content_mapper(msg["content"]))  # type: ignore
    elif msg["role"] == "user":
        return HumanMessage(content=langchain_content_mapper(msg["content"]))  # type: ignore
    elif msg["role"] == "tool":
        return ToolMessage(content=langchain_content_mapper(msg["content"]))  # type: ignore
    return SystemMessage(content=langchain_content_mapper(msg["content"]))  # type: ignore
