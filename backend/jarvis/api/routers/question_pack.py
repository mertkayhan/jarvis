import asyncio
import datetime
import json
from typing import Annotated, Any, Dict, Optional
from uuid import UUID, uuid4
from fastapi import APIRouter, HTTPException, Query, Request
from psycopg import AsyncConnection
from pydantic import BaseModel
from psycopg.rows import dict_row
import logging
from jarvis.db.db import get_connection_pool
from jarvis.question_pack.retriever import generate_embedding


router = APIRouter(prefix="/api/v1/question-packs")
logger = logging.getLogger(__name__)


class Question(BaseModel):
    question: str


class CreateQuestionResp(BaseModel):
    id: str
    question: str


@router.post(
    "/{question_pack_id}/questions",
    response_model=CreateQuestionResp,
    tags=["question pack"],
)
async def create_question(
    req: Request, question_pack_id: str, payload: Question
) -> CreateQuestionResp:
    user_id: str = req.state.claims["sub"]
    query = """
        INSERT INTO common.question_pairs(
            id, pack_id, question, updated_by, answer, question_embedding
        ) values(
            %(question_id)s, %(question_pack_id)s, %(question)s, %(user_id)s, %(dummy)s, %(vector)s
        )
        RETURNING id
    """

    async def insert_question(conn: AsyncConnection) -> CreateQuestionResp:
        async with conn.cursor(row_factory=dict_row) as cur:
            resp = await cur.execute(
                query,
                {
                    "question_id": question_id,
                    "question_pack_id": question_pack_id,
                    "question": payload.question,
                    "user_id": user_id,
                    "dummy": "",
                    "vector": question_embedding,
                },
            )
            res = await resp.fetchall()
            id = res[0]["id"]
            assert str(id) == question_id, "Internal error!"
            return CreateQuestionResp(id=question_id, question=payload.question)

    try:
        question_embedding = await generate_embedding(payload.question)
        question_id = str(uuid4())
        pool = await get_connection_pool()

        async with pool.connection() as conn:
            async with conn.transaction():
                return await insert_question(conn)
    except Exception as err:
        logger.error(f"failed to create new question: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to create question due to internal error, please check the server logs for more information.",
        )


class UserQuestion(BaseModel):
    id: UUID
    metadata: Optional[str] = None
    question: str
    answer: str
    updatedAt: datetime.datetime
    updatedBy: str


class QuestionList(BaseModel):
    questions: list[UserQuestion]
    maxPageNo: int


@router.get(
    "/{question_pack_id}/questions",
    tags=["question pack"],
    response_model=QuestionList,
)
async def get_question_pack_questions(
    question_pack_id: str,
    offset: int = 0,
    limit: int = 10,
    deleted: bool = False,
    tags: Annotated[Optional[list[str]], Query()] = None,
    additional_info: Annotated[Optional[list[str]], Query()] = None,
    search_query: Optional[str] = None,
) -> QuestionList:
    try:
        # build tag filter
        tag_list = None if not tags else tags
        tag_filter = "" if not tag_list else "tag = ANY(%(tags)s)"

        # build additional info filter
        additional_info_list = (
            None
            if not additional_info
            else [json.loads(element) for element in additional_info]
        )
        additional_info_filter = (
            ""
            if not additional_info_list
            else "("
            + " OR ".join(
                [
                    f"(key = %(key{i})s AND value = ANY(%(value{i})s))"
                    for i in range(len(additional_info_list))
                ]
            )
            + ")"
        )

        # construct the query params
        additional_info_query_params = {}
        for i, element in enumerate(additional_info_list or []):
            additional_info_query_params[f"key{i}"] = element["key"]
            additional_info_query_params[f"value{i}"] = element["value"].split(",")

        # build similarity filter
        similarity_filter = (
            ""
            if not search_query
            else "(1 - (question_embedding <=> %(vector)s::vector)) > 0.3 OR x.question_tsv @@ plainto_tsquery('english', %(search_query)s)"
        )

        # build similarity column
        similarity_col = (
            ""
            if not search_query
            else "(0.7 * (1 - (question_embedding <=> %(vector)s::vector)) + 0.3 * ts_rank_cd(x.question_tsv, plainto_tsquery('english', %(search_query)s))) AS similarity"
        )
        real_offset = offset * limit
        query_vector = (
            None if not search_query else await generate_embedding(search_query)
        )

        question_count_query = f"""
            SELECT COUNT(DISTINCT x.*)
            FROM common.question_pairs x 
            LEFT JOIN common.question_tags y
            ON x.id = y.question_id
            LEFT JOIN common.question_additional_info z
            ON x.id = z.question_id
            WHERE x.deleted = %(deleted)s 
                AND x.pack_id = %(question_pack_id)s
                {"AND" if len(tag_filter) > 0 else ""} {tag_filter} 
                {"AND" if len(additional_info_filter) > 0 else ""} {additional_info_filter}
                {"AND" if len(similarity_filter) > 0 else ""} {similarity_filter}
        """

        list_question_query = f"""
            SELECT 
                DISTINCT x.id,
                x.answer, 
                x.question, 
                x.updated_at,
                x.updated_by {"," if len(similarity_col) > 0 else ""}
                {similarity_col}
            FROM common.question_pairs x
            LEFT JOIN common.question_tags y 
            ON x.id = y.question_id 
            LEFT JOIN common.question_additional_info z 
            ON x.id = z.question_id
            WHERE x.deleted = %(deleted)s 
                AND x.pack_id = %(question_pack_id)s
                {"AND" if len(tag_filter) > 0 else ""} {tag_filter} 
                {"AND" if len(additional_info_filter) > 0 else ""} {additional_info_filter}
                {"AND" if len(similarity_filter) > 0 else ""} {similarity_filter}
            ORDER BY x.updated_at DESC {", similarity DESC" if len(similarity_col) > 0 else ""}
            LIMIT %(limit)s
            OFFSET %(offset)s
        """

        logger.info(f"query:\n{list_question_query}")

        async def list_questions(conn: AsyncConnection) -> list[Dict[str, Any]]:
            async with conn.cursor(row_factory=dict_row) as cur:
                resp = await cur.execute(
                    list_question_query,
                    {
                        "tags": tag_list,
                        "vector": query_vector,
                        "search_query": search_query,
                        "limit": limit,
                        "offset": real_offset,
                        "deleted": deleted,
                        "question_pack_id": question_pack_id,
                        **additional_info_query_params,
                    },
                )
                res = await resp.fetchall()
                return res

        async def count_questions(conn: AsyncConnection):
            async with conn.cursor(row_factory=dict_row) as cur:
                resp = await cur.execute(
                    question_count_query,
                    {
                        "tags": tag_list,
                        "vector": query_vector,
                        "search_query": search_query,
                        "deleted": deleted,
                        "question_pack_id": question_pack_id,
                        **additional_info_query_params,
                    },
                )
                res = await resp.fetchall()
                return res[0]["count"]

        pool = await get_connection_pool()
        async with pool.connection() as conn:
            [question_list, question_count] = await asyncio.gather(
                list_questions(conn),
                count_questions(conn),
            )
            return QuestionList(
                maxPageNo=((question_count - 1) // limit) + 1,
                questions=[
                    UserQuestion(
                        id=r["id"],
                        answer=r["answer"],
                        question=r["question"],
                        updatedAt=r["updated_at"],
                        updatedBy=r["updated_by"],
                    )
                    for r in question_list
                ],
            )
    except Exception as err:
        logger.error(f"failed to list questions: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to list questions due to internal error, please check the server logs for more information.",
        )
