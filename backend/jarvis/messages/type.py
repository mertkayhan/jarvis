from typing import Any, Literal, Optional, TypedDict, Union


class TextContent(TypedDict):
    type: str
    text: str


class ImageUrl(TypedDict):
    url: str


class ImageContent(TypedDict):
    type: str
    image_url: ImageUrl


MessageContent = Union[TextContent, ImageContent]


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
