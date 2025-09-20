from .chat import router as chat_router
from .doc import router as doc_router
from .personality import router as personality_router
from .misc import router as misc_router
from .document_pack import router as document_pack_router

__all__ = [
    "chat_router",
    "doc_router",
    "personality_router",
    "misc_router",
    "document_pack_router",
]
