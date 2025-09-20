import logging
from typing import Optional, cast
from uuid import UUID, uuid4
from fastapi import APIRouter, HTTPException, Request
from psycopg.rows import dict_row
from pydantic import BaseModel
from jarvis.db.db import get_connection_pool


router = APIRouter(prefix="/api/v1/document-packs")
logger = logging.getLogger(__name__)


class DocumentPack(BaseModel):
    id: Optional[UUID] = None
    name: str
    description: str


class DocumentPacks(BaseModel):
    packs: list[DocumentPack]


@router.get("/", response_model=DocumentPacks, tags=["document_packs"])
@router.get("", response_model=DocumentPacks, tags=["document_packs"])
async def list_document_packs(req: Request) -> DocumentPacks:
    user_id: str = req.state.claims["sub"]

    query = """
        SELECT 
        id, 
        name, 
        description
    FROM common.document_packs
    WHERE deleted = false AND owner = (%s)
    ORDER BY updated_at DESC
    """

    try:
        pool = await get_connection_pool()
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                resp = await cur.execute(query, (user_id,))
                res = await resp.fetchall()
                return DocumentPacks(packs=[DocumentPack(**r) for r in res])
    except Exception as err:
        logger.error(f"failed to list document packs: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="failed to list document packs, please refer to the server logs for more information",
        )


@router.put("/{id}")
async def update_document_pack(id: str, payload: DocumentPack):
    query = """
        UPDATE common.document_packs
        SET name = %(name)s, description = %(description)s
        WHERE id = %(id)s
        RETURNING id, name, description
    """

    try:
        pool = await get_connection_pool()
        async with pool.connection() as conn:
            async with conn.transaction():
                async with conn.cursor(row_factory=dict_row) as cur:
                    resp = await cur.execute(
                        query,
                        {
                            "name": payload.name,
                            "description": payload.description,
                            "id": id,
                        },
                    )
                    await resp.fetchall()
    except Exception as err:
        logger.error(f"failed to update document pack {id}: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="failed to update document pack, please refer to the server logs for more information",
        )


@router.delete("/{id}")
async def delete_document_pack(id: str):
    query = """
        UPDATE common.document_packs
        SET deleted = true
        WHERE id = (%s)
        RETURNING id
    """

    try:
        pool = await get_connection_pool()
        async with pool.connection() as conn:
            async with conn.transaction():
                async with conn.cursor(row_factory=dict_row) as cur:
                    resp = await cur.execute(query, (id,))
                    await resp.fetchall()
    except Exception as err:
        logger.error(f"failed to delete document pack {id}: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="failed to delete document pack, please refer to the server logs for more information",
        )


@router.post("/")
@router.post("")
async def create_document_pack(req: Request, payload: DocumentPack):
    user_id: str = req.state.claims["sub"]
    query = """
    INSERT INTO common.document_packs (
        id, name, description, owner
    ) VALUES (
        %(id)s, %(name)s, %(description)s, %(owner)s
    )
    RETURNING id, name, description
    """

    try:
        pool = await get_connection_pool()
        async with pool.connection() as conn:
            async with conn.transaction():
                async with conn.cursor(row_factory=dict_row) as cur:
                    resp = await cur.execute(
                        query,
                        {
                            "id": uuid4(),
                            "name": payload.name,
                            "description": payload.description,
                            "owner": user_id,
                        },
                    )
                    await resp.fetchall()
    except Exception as err:
        logger.error(f"failed to delete document pack {id}: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="failed to delete document pack, please refer to the server logs for more information",
        )
