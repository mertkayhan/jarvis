import datetime
from typing import Optional
from uuid import UUID
from psycopg import AsyncConnection
from pydantic import BaseModel
from psycopg.rows import dict_row


class UserChat(BaseModel):
    id: UUID
    owner_email: str
    title: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime


async def get_all_user_chats(
    user_id: str,
    conn: AsyncConnection,
    deleted: bool = False,
    limit: int = 5,
) -> list[UserChat]:

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
        LIMIT %(limit)s
    """

    async with conn.cursor(row_factory=dict_row) as cur:
        resp = await cur.execute(
            query,
            {"user_id": user_id, "deleted": deleted, "limit": limit},
        )
        res = await resp.fetchall()
        return [UserChat(**r) for r in res]
