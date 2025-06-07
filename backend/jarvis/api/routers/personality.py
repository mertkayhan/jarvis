import asyncio
import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
from fastapi import APIRouter, HTTPException, Request
from psycopg import AsyncConnection
from pydantic import BaseModel
from psycopg.rows import dict_row
import logging
from jarvis.db.db import get_connection_pool
from jarvis.tools import ALL_AVAILABLE_TOOLS


router = APIRouter(prefix="/api/v1/personalities")
logger = logging.getLogger(__name__)


class Personality(BaseModel):
    name: str
    description: str
    owner: str = ""
    id: Optional[UUID] = None
    instructions: str = ""
    isDefault: bool = False
    tools: List[str] = []
    doc_ids: List[str] = []


class Personalities(BaseModel):
    personalities: List[Personality]


@router.get("/default")
async def get_default_personality(req: Request) -> Personality:
    user_id: str = req.state.claims["sub"]
    query = """
    SELECT
        name,
        tools,
        instructions,
        description
    FROM common.default_personalities x
    INNER JOIN common.personalities y
    ON x.personality_id = y.id
    WHERE x.user_id = (%s)
    """

    try:
        pool = await get_connection_pool()
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                resp = await cur.execute(query, (user_id,))
                res = await resp.fetchall()
                return (
                    Personality(
                        id=res[0]["id"],
                        description=res[0]["description"],
                        name=res[0]["name"],
                        owner=res[0]["owner"],
                        isDefault=True,
                        tools=res[0]["tools"],
                    )
                    if res
                    else Personality(
                        name="default",
                        tools=ALL_AVAILABLE_TOOLS,
                        description="This is the default system prompt for Jarvis.",
                        instructions=f"""
            The assistant is Jarvis.

            The current date is {datetime.datetime.now(datetime.timezone.utc).isoformat()}.

            ## Thought Process & Reasoning
            - When faced with a math, logic, or complex reasoning problem, Jarvis systematically thinks through the problem step by step before delivering a final answer.
            - Jarvis provides thorough responses to complex or open-ended questions and concise responses to simpler tasks.

            ## Information Extraction & Prioritization
            - **Primary Source**: When a question pack is available, prioritize extracting relevant information from it before considering other sources or asking the user for additional details.
            - **Fallback Strategy**: If the question pack does not contain the necessary information, then proceed to ask the user for more specific details or use other available tools, such as web search.
            - **Clarification**: Only ask the user for additional information if the question pack and other tools do not provide a satisfactory answer.
        
            ## Conversational Approach
            - Jarvis engages in **authentic, natural conversations**, responding to the user's input, asking relevant follow-up questions only when necessary.
            - Jarvis avoids excessive questioning and ensures a balanced dialogue.
            - Jarvis adapts its tone and style to the user's preference and context.

            ## Capabilities & Tools
            - Jarvis assists with **analysis, question answering, coding, document understanding, creative writing, teaching, and general discussions**.
            - Jarvis retrieves up-to-date information from the web using Google Search when necessary.
            - If analyzing a document it does not have access to, Jarvis prompts the user to upload it to the Document Repository. The user must attach the processed document for analysis.

            ## Formatting & Usability
            - Jarvis follows best practices for **Markdown formatting** to enhance clarity and readability.
            - Jarvis continuously improves based on user feedback.

            ## Language Adaptability
            - Jarvis follows these instructions in all languages and responds in the language the user uses or requests.
            """,
                    )
                )
    except Exception as err:
        logger.error(f"failed to get default personality: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="failed to get default personality, please refer to the server logs for more information",
        )


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
    # TODO: This needs to be a join!
    list_query = """
        SELECT 
            id,
            description,
            name,
            owner
        FROM common.personalities
        WHERE deleted = false AND owner IN ('system', %(user_id)s)
        ORDER BY updated_at DESC
    """
    default_query = """
        SELECT 
            user_id,
            personality_id
        FROM common.default_personalities 
        WHERE user_id = %(user_id)s
    """

    async def _get_default_personality(conn: AsyncConnection) -> Dict[str, Any]:
        async with conn.cursor(row_factory=dict_row) as cur:
            resp = await cur.execute(default_query, {"user_id": user_id})
            res = await resp.fetchall()
            return res[0] if res else {"personality_id": None}

    async def _get_personalities(conn: AsyncConnection) -> List[Dict[str, Any]]:
        async with conn.cursor(row_factory=dict_row) as cur:
            resp = await cur.execute(list_query, {"user_id": user_id})
            res = await resp.fetchall()
            return res

    try:
        pool = await get_connection_pool()
        async with pool.connection() as conn:
            [personalities, default_personality] = await asyncio.gather(
                *[_get_personalities(conn), _get_default_personality(conn)]
            )
            return Personalities(
                personalities=[
                    Personality(
                        id=p["id"],  # type: ignore
                        description=p["description"],  # type: ignore
                        name=p["name"],  # type: ignore
                        owner=p["owner"],  # type: ignore
                        isDefault=(default_personality["personality_id"] == p["id"]),  # type: ignore
                    )
                    for p in personalities
                ]
            )

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
