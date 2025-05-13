import datetime
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Request
import logging
from pydantic import BaseModel
from jarvis.blob_storage import resolve_storage
from jarvis.db.db import get_connection_pool
from psycopg.rows import dict_row


router = APIRouter(prefix="/api/v1/docs")
logger = logging.getLogger(__name__)


class UserDocument(BaseModel):
    name: str
    id: UUID
    owner: str
    href: str
    pageCount: Optional[int] = None
    tokenCount: Optional[int] = None
    createdAt: datetime.datetime


class UserDocuments(BaseModel):
    docs: List[UserDocument]


@router.get(
    "",
    response_model=UserDocuments,
    include_in_schema=False,
)
@router.get(
    "/",
    response_model=UserDocuments,
    tags=["document"],
)
async def get_user_docs(req: Request, deleted: bool = False) -> UserDocuments:
    user_id: str = req.state.claims["sub"]
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
    """
    try:
        storage = resolve_storage()
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
                return UserDocuments(
                    docs=[
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
                )

    except Exception as err:
        logger.error(f"failed to list user documents: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="failed to list user documents, for more details please refer to the server logs",
        )


class DeleteDocumentResult(BaseModel):
    id: UUID


@router.delete(
    "/{doc_id}",
    response_model=DeleteDocumentResult,
    tags=["document"],
)
async def delete_doc(doc_id: str) -> DeleteDocumentResult:
    query = """
        UPDATE common.document_repo
        SET deleted = true
        WHERE document_id = (%s)
        RETURNING document_id
    """
    try:
        pool = await get_connection_pool()
        async with pool.connection() as conn:
            async with conn.transaction():
                async with conn.cursor(row_factory=dict_row) as cur:
                    resp = await cur.execute(query, (doc_id,))
                    res = await resp.fetchall()
                    return DeleteDocumentResult(id=res[0]["document_id"])
    except Exception as err:
        logger.error(f"failed to delete user document: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="failed to delete document, please refer to the server logs for more details",
        )
