from dataclasses import dataclass
from typing import Optional


@dataclass
class Message:
    id: str
    chatId: str
    userId: str
    createdAt: str
    content: str
    data: Optional[str] = None
    role: str = "assistant"
    score: Optional[float] = None
    liked: Optional[bool] = None
    context: Optional[str] = None
