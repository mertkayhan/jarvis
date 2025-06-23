import asyncio
import datetime
from typing import Any, List, Optional, Union
from uuid import UUID
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import logging
from jarvis.chat.chat_title import create_chat_title
from jarvis.db.db import get_connection_pool
from jarvis.messages.type import MessageContent
from jarvis.models.models import model_factory
from jarvis.queries.query_handlers import (
    get_chat_model,
    get_message_history,
    update_chat_title,
)
from psycopg.rows import dict_row


router = APIRouter(prefix="/api/v1/chats")
logger = logging.getLogger(__name__)


class AutoGenChatTitle(BaseModel):
    title: str


@router.patch(
    "/{chat_id}/title/autogen", response_model=AutoGenChatTitle, tags=["chat"]
)
async def generate_chat_title(chat_id: str) -> AutoGenChatTitle:
    try:
        [chat_model, history] = await asyncio.gather(
            *[get_chat_model(chat_id), get_message_history(chat_id)]
        )
        model = model_factory(chat_model, 0)  # type: ignore
        if model and history and isinstance(history, list):
            title = await create_chat_title(model, history)
            await update_chat_title(chat_id, title)
            return AutoGenChatTitle(title=title)
        else:
            raise TypeError(f"{model=} {history=}")
    except Exception as err:
        logger.error(f"failed to create chat title: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Title generation failed, please refer to the server logs for more information.",
        )


class UserChat(BaseModel):
    id: UUID
    owner_email: str
    title: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime


class UserChats(BaseModel):
    chats: List[UserChat]


@router.get(
    "",
    response_model=UserChats,
    tags=["chat"],
    include_in_schema=False,
)
@router.get(
    "/",
    response_model=UserChats,
    tags=["chat"],
)
async def get_all_user_chats(req: Request, deleted: bool = False) -> UserChats:
    user_id: str = req.state.claims["sub"]
    query = """
        SELECT 
            id,
            owner_email,
            title,
            created_at, 
            updated_at
        FROM common.chat_history 
        WHERE owner_email = %(user_id)s AND deleted = %(deleted)s
        ORDER BY updated_at DESC
    """
    try:
        pool = await get_connection_pool()
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                resp = await cur.execute(
                    query,
                    {
                        "user_id": user_id,
                        "deleted": deleted,
                    },
                )
                res = await resp.fetchall()
                return UserChats(chats=[UserChat(**r) for r in res])
    except Exception as err:
        logger.error(f"failed to fetch user chats: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="failed to fetch user chats, please refer to server logs for more information",
        )


class DeletedChats(BaseModel):
    id: List[UUID]


@router.delete(
    "",
    response_model=DeletedChats,
    tags=["chat"],
    include_in_schema=False,
)
@router.delete(
    "/",
    response_model=DeletedChats,
    tags=["chat"],
)
async def delete_all_user_chats(req: Request) -> DeletedChats:
    user_id: str = req.state.claims["sub"]
    query = """
        UPDATE common.chat_history 
        SET deleted = true 
        WHERE owner_email = (%s)
        RETURNING id
    """
    try:
        pool = await get_connection_pool()
        async with pool.connection() as conn:
            async with conn.transaction():
                async with conn.cursor(row_factory=dict_row) as cur:
                    resp = await cur.execute(query, (user_id,))
                    res = await resp.fetchall()
                    return DeletedChats(id=[r["id"] for r in res])
    except Exception as err:
        logger.error(f"failed to delete user chats: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="failed to delete user chats, please refer to server logs for more details",
        )


class DeleteChatResult(BaseModel):
    id: UUID


@router.delete(
    "/{chat_id}",
    response_model=DeleteChatResult,
    tags=["chat"],
)
async def delete_chat(chat_id: str) -> DeleteChatResult:
    query = """
        UPDATE common.chat_history 
        SET deleted = true 
        WHERE id = (%s)
        RETURNING id
    """
    try:
        pool = await get_connection_pool()
        async with pool.connection() as conn:
            async with conn.transaction():
                async with conn.cursor(row_factory=dict_row) as cur:
                    resp = await cur.execute(query, (chat_id,))
                    res = await resp.fetchall()
                    return DeleteChatResult(id=res[0]["id"])
    except Exception as err:
        logger.error(f"failed to delete chat: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="failed to delete chat, please refer to server logs for more details",
        )


class ChatTitleUpdate(BaseModel):
    new_title: str


class ChatTitleUpdateResult(BaseModel):
    title: str
    chat_id: UUID


@router.patch(
    "/{chat_id}/title",
    response_model=ChatTitleUpdateResult,
    tags=["chat"],
)
async def update_user_chat_title(
    chat_id: str, payload: ChatTitleUpdate
) -> ChatTitleUpdateResult:
    query = """
        UPDATE common.chat_history
        SET title = %(new_title)s
        WHERE id = %(chat_id)s
        RETURNING id, title
    """
    try:
        pool = await get_connection_pool()
        async with pool.connection() as conn:
            async with conn.transaction():
                async with conn.cursor(row_factory=dict_row) as cur:
                    resp = await cur.execute(
                        query,
                        {
                            "new_title": payload.new_title,
                            "chat_id": chat_id,
                        },
                    )
                    res = await resp.fetchall()
                    return ChatTitleUpdateResult(
                        chat_id=res[0]["id"],
                        title=res[0]["title"],
                    )

    except Exception as err:
        logger.error(f"failed to update chat title: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="failed to update chat title, please refer to server logs for more details",
        )


class ChatTitle(BaseModel):
    title: Optional[str] = None


@router.get("/{chat_id}/title", response_model=ChatTitle)
async def get_chat_title(chat_id: str) -> ChatTitle:
    query = """
        SELECT
            title
        FROM common.chat_history
        WHERE id = (%s)
    """

    try:
        pool = await get_connection_pool()
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                resp = await cur.execute(query, (chat_id,))
                res = await resp.fetchall()
                return ChatTitle(title=res[0]["title"] if res else None)

    except Exception as err:
        logger.error(f"failed to fetch chat title: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="failed to fetch chat title, please refer to server logs for more details",
        )


class ChatMessage(BaseModel):
    chatId: UUID
    content: list[MessageContent]
    createdAt: datetime.datetime
    data: Optional[dict[str, Any]] = None
    id: UUID
    liked: Optional[bool] = None
    role: str
    score: Optional[float] = None
    updatedAt: datetime.datetime


class MessageHistory(BaseModel):
    messages: List[ChatMessage]


@router.get("/{chat_id}/messages", response_model=MessageHistory)
async def get_chat_messages(chat_id: str) -> MessageHistory:
    query = """
        SELECT 
            chat_id,
            content, 
            created_at,
            data,
            id,
            liked, 
            role,
            score,
            updated_at,
            context 
        FROM common.message_history
        WHERE chat_id = %(chat_id)s AND role IN ('user', 'assistant')
        ORDER BY created_at ASC
    """

    try:
        pool = await get_connection_pool()
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                resp = await cur.execute(
                    query,
                    {"chat_id": chat_id},
                )
                res = await resp.fetchall()
                return MessageHistory(
                    messages=[
                        ChatMessage(
                            chatId=r["chat_id"],
                            content=r["content"],
                            createdAt=r["created_at"],
                            data=r["data"],
                            id=r["id"],
                            liked=r["liked"],
                            role=r["role"],
                            score=r["score"],
                            updatedAt=r["updated_at"],
                        )
                        for r in res
                    ]
                )
    except Exception as err:
        logger.error(f"failed to fetch message history: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="failed to fetch chat message history, please refer to server logs for more details",
        )


class DeleteMessageResult(BaseModel):
    id: UUID


@router.delete(
    "/chats/{chat_id}/messages/{message_id}", response_model=DeleteMessageResult
)
async def delete_message(chat_id: str, message_id: str) -> DeleteMessageResult:
    query = """
        DELETE FROM common.message_history 
        WHERE id = (%s)
        RETURNING id
    """

    try:
        pool = await get_connection_pool()
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                resp = await cur.execute(query, (message_id,))
                res = await resp.fetchall()
                return DeleteMessageResult(id=res[0]["id"])
    except Exception as err:
        logger.error(f"failed to delete message: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="failed to delete message, please refer to server logs for more details",
        )
