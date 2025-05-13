import asyncio
import datetime
from typing import List
from uuid import UUID
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import logging
from jarvis.chat.chat_title import create_chat_title
from jarvis.db.db import get_connection_pool
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
            get_chat_model(chat_id), get_message_history(chat_id)
        )
        model = model_factory(chat_model, 0)  # type: ignore
        title = await create_chat_title(model, history)
        await update_chat_title(chat_id, title)
        return AutoGenChatTitle(title=title)
    except Exception as err:
        logger.error(f"failed to create chat title: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Title generation failed, please refer to the server logs for more information.",
        )


class UserChat(BaseModel):
    id: UUID
    owner_email: str
    title: str
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
    id: List[str]


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
