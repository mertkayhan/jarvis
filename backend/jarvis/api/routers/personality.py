from uuid import UUID, uuid4
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from psycopg.rows import dict_row
import logging
from jarvis.db.db import get_connection_pool
from personality.personality import (
    Personality,
    get_user_personalities as list_personalities,
)


router = APIRouter(prefix="/api/v1/personalities")
logger = logging.getLogger(__name__)


class Personalities(BaseModel):
    personalities: list[Personality]


@router.get(
    "",
    response_model=Personalities,
    tags=["personality"],
    include_in_schema=False,
)
@router.get(
    "/",
    response_model=Personalities,
    tags=["personality"],
)
async def get_user_personalities(req: Request) -> Personalities:
    user_id: str = req.state.claims["sub"]

    try:
        pool = await get_connection_pool()
        async with pool.connection() as conn:
            p = await list_personalities(user_id, conn)
            return Personalities(personalities=p.personalities)
    except Exception as err:
        logger.error(f"failed to get user personalities: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="failed to get user personalities, please refer to the server logs for more information",
        )


class CreatePersonalityResult(BaseModel):
    id: UUID


@router.post(
    "",
    response_model=CreatePersonalityResult,
    tags=["personality"],
)
async def create_personality(
    req: Request, payload: Personality
) -> CreatePersonalityResult:
    user_id: str = req.state.claims["sub"]
    query = """
        INSERT INTO common.personalities (
            id, instructions, name, owner, description, tools, doc_ids
        ) VALUES (
            %(id)s, %(instructions)s, %(name)s, %(owner)s, %(description)s, %(tools)s, %(doc_ids)s
        )
        RETURNING id
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
                            "instructions": payload.instructions,
                            "name": payload.name,
                            "owner": user_id,
                            "description": payload.description,
                            "tools": payload.tools,
                            "doc_ids": payload.doc_ids,
                        },
                    )
                    res = await resp.fetchall()
                    return CreatePersonalityResult(id=res[0]["id"])

    except Exception as err:
        logger.error(f"failed to create personality: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="failed to create personality, please refer to server logs for more details",
        )


class DeletePersonalityResult(BaseModel):
    id: UUID


@router.delete(
    "/{personality_id}",
    response_model=DeletePersonalityResult,
    tags=["personality"],
)
async def delete_personality(personality_id: str) -> DeletePersonalityResult:
    query = """
        UPDATE common.personalities
        SET deleted = true 
        WHERE id = (%s)
        RETURNING id
    """
    try:
        pool = await get_connection_pool()
        async with pool.connection() as conn:
            async with conn.transaction():
                async with conn.cursor(row_factory=dict_row) as cur:
                    resp = await cur.execute(query, (personality_id,))
                    res = await resp.fetchall()
                    return DeletePersonalityResult(id=res[0]["id"])
    except Exception as err:
        logger.error(f"failed to delete personality: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="failed to delete personality, please refer to the server logs for more information",
        )


class UpdatePersonalityResult(BaseModel):
    id: UUID


@router.put(
    "/{personality_id}",
    response_model=UpdatePersonalityResult,
    tags=["personality"],
)
async def update_personality(
    req: Request, personality_id: str, payload: Personality
) -> UpdatePersonalityResult:
    user_id: str = req.state.claims["sub"]
    query = """
        UPDATE common.personalities
        SET name = %(name)s, instructions = %(instructions)s, description = %(description)s, tools = %(tools)s, doc_ids = %(docs)s, owner = %(owner)s
        WHERE id = %(id)s
        RETURNING id
    """
    try:
        pool = await get_connection_pool()
        async with pool.connection() as conn:
            async with conn.transaction():
                async with conn.cursor(row_factory=dict_row) as cur:
                    resp = await cur.execute(
                        query,
                        {
                            "id": personality_id,
                            "name": payload.name,
                            "instructions": payload.instructions,
                            "description": payload.description,
                            "tools": payload.tools,
                            "docs": payload.doc_ids,
                            "owner": user_id,
                        },
                    )
                    res = await resp.fetchall()
                    return UpdatePersonalityResult(id=res[0]["id"])
    except Exception as err:
        logger.error(f"failed to update personality: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="failed to update personality, please check server logs for more information",
        )
