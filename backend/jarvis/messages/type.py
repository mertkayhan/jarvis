from dataclasses import dataclass
from typing import Optional


@dataclass
class Message:
    id: str
    createdAt: str
    content: str
    data: str
    role: str = "assistant"
    score: Optional[float] = None
    liked: Optional[bool] = None
    context: Optional[str] = None
