from typing import Any, Dict, List
from jarvis.db.db import get_connection_pool
from psycopg.rows import dict_row


async def retrieve(
    pack_id: str, query_embedding: str, query: str
) -> List[Dict[str, Any]]:
    pool = await get_connection_pool()
    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            resp = await cur.execute(
                """
                WITH tags AS (
                    SELECT
                        question_id, 
                        STRING_AGG(tag, ',') AS tags
                    FROM common.question_tags
                    WHERE pack_id = %(pack_id)s
                    GROUP BY question_id 
                ),
                additional_info_array AS (
                    SELECT
                        question_id,
                        JSON_AGG(JSON_BUILD_OBJECT(key, value)) AS additional_info
                    FROM common.question_additional_info
                    WHERE pack_id = %(pack_id)s
                    GROUP BY question_id
                )
                SELECT 
                    x.id,
                    x.question,
                    x.answer,
                    0.7 * (1 - (x.question_embedding <=> %(query_embedding)s::vector)) + 0.3 * ts_rank_cd(x.question_tsv, plainto_tsquery('english', %(query)s)) AS similarity,
                    y.tags,
                    z.additional_info
                FROM common.question_pairs x
                LEFT JOIN tags y
                ON x.id = y.question_id
                LEFT JOIN additional_info_array z
                ON x.id = z.question_id
                WHERE pack_id = %(pack_id)s AND deleted = false
                ORDER BY similarity DESC 
                LIMIT 5
                """,
                {
                    "pack_id": pack_id,
                    "query_embedding": query_embedding,
                    "query": query,
                },
            )
            res = await resp.fetchall()
            return res
