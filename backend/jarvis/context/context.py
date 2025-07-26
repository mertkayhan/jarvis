from __future__ import annotations
import asyncio
from typing import List, Optional, TypedDict
import logging
from dataclasses import dataclass
from jarvis.messages.type import Message
from langchain_core.documents import Document
import json
from langchain_core.language_models.chat_models import BaseChatModel
from jarvis.document_pack.type import DocumentPack
from jarvis.question_pack.type import QuestionPack


logger = logging.getLogger(__name__)


class Context:

    def __init__(
        self,
        question_pack: Optional[QuestionPack] = None,
        document_pack: Optional[DocumentPack] = None,
        system_prompt: Optional[Message] = None,
    ):
        self.q: asyncio.Queue[ToolContext] = asyncio.Queue()
        self.question_pack = question_pack
        self.document_pack = document_pack
        self.system_prompt = system_prompt

    @property
    def size(self) -> int:
        return self.q.qsize()

    async def publish(self, item: ToolContext):
        try:
            self.q.put_nowait(item)
        except asyncio.QueueFull as err:
            logger.debug("Queue is full!")
            raise RuntimeError("Queue is full!") from err

    async def read(self):
        try:
            return self.q.get_nowait()
        except asyncio.QueueEmpty:
            logger.debug("Queue empty!")
            return None

    def __aiter__(self):
        return self

    async def __anext__(self) -> ToolContext:
        msg = await self.read()
        if not msg:
            raise StopAsyncIteration
        return msg

    async def to_json(self) -> str:
        return json.dumps([c.to_json() async for c in self])


@dataclass
class ToolContext:
    tool_name: str
    tool_input: str  # JSON string
    tool_output: List[Document]

    def to_json(self) -> str:
        return json.dumps(
            {
                "tool_name": self.tool_name,
                "tool_input": self.tool_input,
                "tool_output": [o.to_json() for o in self.tool_output],
            }
        )


class FaithfullnessParams(TypedDict):
    ctx: "Context"
    user_message: str
    llm: BaseChatModel
