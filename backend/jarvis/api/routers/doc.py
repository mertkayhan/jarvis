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
