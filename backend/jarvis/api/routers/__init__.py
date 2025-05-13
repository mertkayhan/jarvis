from .chat import router as chat_router
from .doc import router as doc_router
from .question_pack import router as question_pack_router
from .personality import router as personality_router
from .misc import router as misc_router

__all__ = [
    "chat_router",
    "doc_router",
    "question_pack_router",
    "personality_router",
    "misc_router",
]
