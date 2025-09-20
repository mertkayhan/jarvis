import datetime
from typing import Optional
from uuid import UUID
from psycopg import AsyncConnection
from pydantic import BaseModel
from psycopg.rows import dict_row
from jarvis.blob_storage import resolve_storage


class UserDocument(BaseModel):
    name: str
    id: UUID
    owner: str
    href: str
    pageCount: Optional[int] = None
    tokenCount: Optional[int] = None
    createdAt: datetime.datetime


async def get_user_docs(
    user_id: str,
    conn: AsyncConnection,
    deleted: bool = False,
    limit: int = 5,
) -> list[UserDocument]:
    query = """
        SELECT 
            document_id,
            document_name,
            num_pages,
            num_tokens,
            created_at 
        FROM common.document_repo
        WHERE owner = %(user_id)s AND deleted = %(deleted)s
        ORDER BY updated_at DESC
        LIMIT %(limit)s
    """

    storage = resolve_storage()

    async with conn.cursor(row_factory=dict_row) as cur:
        resp = await cur.execute(
            query,
            {"user_id": user_id, "deleted": deleted, "limit": limit},
        )
        res = await resp.fetchall()
        return [
            UserDocument(
                id=r["document_id"],
                name=r["document_name"],
                pageCount=r["num_pages"],
                tokenCount=r["num_tokens"],
                createdAt=r["created_at"],
                owner=user_id,
                href=storage.generate_presigned_url(
                    f"raw/{user_id}/{r['document_id']}/{r['document_name']}"
                ),
            )
            for r in res
        ]
