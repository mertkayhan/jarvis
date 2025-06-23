from typing import Any, Literal, Optional, TypedDict


class MessageContent(TypedDict):
    logicalType: Literal["text", "image_url"]  # TODO: extend this
    data: str


class Message(TypedDict):
    id: str
    chatId: str
    userId: str
    createdAt: str
    content: list[MessageContent]
    data: Optional[dict[str, Any]]
    role: Literal["assistant", "user", "tool", "system"]
    score: Optional[float]
    liked: Optional[bool]
    context: Optional[str]
