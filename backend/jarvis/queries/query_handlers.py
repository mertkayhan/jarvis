import json
import os
from typing import Any, Dict, List, Optional, Sequence, Set, Union, cast
import logging
from uuid import uuid4
from psycopg import AsyncConnection
from psycopg.rows import dict_row
from jarvis.blob_storage import resolve_storage
from jarvis.db.db import get_connection_pool
from dotenv import load_dotenv
from psycopg.types.json import Jsonb
from jarvis.messages.type import Message
from jarvis.messages.utils import convert_to_langchain_message
from jarvis.models.models import get_default_model
from langchain_core.messages import AIMessage, HumanMessage

logger = logging.getLogger(__name__)
load_dotenv()


async def create_chat(chat_id: str, owner_id: str):
    query = """
    INSERT INTO common.chat_history (
        id, owner_email, allow_list 
    ) VALUES (
        (%s), (%s), (%s)
    )
    ON CONFLICT DO NOTHING
    """

    pool = await get_connection_pool()

    async with pool.connection() as conn:
        async with conn.transaction():
            async with conn.cursor() as cur:
                # TODO: allow list
                await cur.execute(query, (chat_id, owner_id, []))


async def create_message(data: Message):
    query = """
    INSERT INTO common.message_history (
        chat_id, content, id, role, data, score, context
    ) VALUES (
        %(chat_id)s, %(content)s, %(id)s, %(role)s, %(data)s, %(score)s, %(context)s 
    )
    ON CONFLICT DO NOTHING 
    """

    pool = await get_connection_pool()
    async with pool.connection() as conn:
        async with conn.transaction():
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    query,
                    {
                        "id": data["id"],
                        "content": Jsonb(data["content"]),
                        "chat_id": data["chatId"],
                        "role": data["role"],
                        "data": Jsonb(data.get("data")),
                        "score": data.get("score"),
                        "context": data.get("context"),
                    },
                )


async def read_docs_helper(docs: Optional[Sequence[str]]) -> str:
    if not docs:
        return ""

    return await read_docs(docs)


async def read_docs(ids: Sequence[str]) -> str:
    query = """
    SELECT 
        document_id, 
        document_name,
        owner
    FROM common.document_repo
    WHERE document_id = ANY(%s)
    """

    pool = await get_connection_pool()
    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            resp = await cur.execute(query, (list(ids),))
            res = await resp.fetchall()

    storage = resolve_storage()
    out = []

    for doc in res:
        raw_content = storage.read(
            f"parsed/{doc['owner']}/{doc['document_id']}/{doc['document_name']}.md"
        )
        try:
            content = raw_content.decode("utf-8")
        except UnicodeDecodeError:
            content = raw_content.decode("windows-1252")  # Handle non-UTF-8 files

        out.append(f"# Document Name: {doc['document_name']}\n\n{content}")

    return "\n\n".join(out)


async def update_document_pack_status(id: str, status: str):
    query = """
    UPDATE common.document_packs
    SET stage = %(status)s
    WHERE id = %(id)s
    """

    pool = await get_connection_pool()

    async with pool.connection() as conn:
        async with conn.transaction():
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(query, {"id": id, "status": status})


async def update_chat(id, personality, documents):
    query = """
    UPDATE common.chat_history
    SET personality = %(personality)s, documents = %(documents)s
    WHERE id = %(id)s
    """
    pool = await get_connection_pool()

    async with pool.connection() as conn:
        async with conn.transaction():
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    query,
                    {
                        "personality": json.dumps(personality),
                        "documents": documents,
                        "id": id,
                    },
                )


async def get_model_selection(user) -> str:
    query = """
    SELECT 
        model_name 
    FROM common.model_selection
    WHERE user_id = (%s)
    """
    pool = await get_connection_pool()

    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            resp = await cur.execute(query, (user,))
            res = await resp.fetchall()

        if not res:
            logger.info(
                f"{user} has no model preference in the database, returning default model..."
            )
            return get_default_model()

        model_selection = res[0].get("model_name", get_default_model())
        if not model_selection:
            logger.warning(
                f"model_selection for {user} is None and this should not happen! Returning default model"
            )
            return get_default_model()
        return model_selection


async def get_chat_model(id) -> Optional[str]:
    query = """
    SELECT
        model_name 
    FROM common.chat_history
    WHERE id = (%s)
    """
    pool = await get_connection_pool()

    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            resp = await cur.execute(query, (id,))
            res = await resp.fetchall()

    return res[0]["model_name"] if res else None


async def set_chat_model(id, model_name):
    query = """
    UPDATE common.chat_history 
    SET model_name = (%s)
    WHERE id = (%s)
    """
    pool = await get_connection_pool()
    async with pool.connection() as conn:
        async with conn.transaction():
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    query,
                    (
                        model_name,
                        id,
                    ),
                )


async def insert_doc(document_id, document_name, owner, num_pages, num_tokens):
    query = """
    INSERT INTO common.document_repo (
        document_id, document_name, owner, num_pages, num_tokens
    ) VALUES (
        %(document_id)s, %(document_name)s, %(owner)s, %(num_pages)s, %(num_tokens)s
    )
    """
    pool = await get_connection_pool()
    async with pool.connection() as conn:
        async with conn.transaction():
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    query,
                    {
                        "document_id": document_id,
                        "document_name": document_name,
                        "owner": owner,
                        "num_pages": num_pages,
                        "num_tokens": num_tokens,
                    },
                )


async def insert_doc_into_pack(document_name: str, pack_id: str, document_id: str):
    # TODO: bulk insert
    query = """
    INSERT INTO common.document_pack_docs (
        id, pack_id, name
    ) VALUES (
        %(id)s, %(pack_id)s, %(name)s
    )
    ON CONFLICT DO NOTHING
    """
    pool = await get_connection_pool()
    async with pool.connection() as conn:
        async with conn.transaction():
            async with conn.cursor(row_factory=dict_row) as cur:
                await cur.execute(
                    query,
                    {
                        "id": document_id,
                        "name": document_name,
                        "pack_id": pack_id,
                    },
                )


async def get_chat_docs(id: str) -> Set[str]:
    query = """
    SELECT 
        documents
    FROM common.chat_history
    WHERE id = (%s)
    """
    pool = await get_connection_pool()

    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            resp = await cur.execute(query, (id,))
            res = await resp.fetchall()
    return set(res[0]["documents"])


async def update_chat_title(id: str, title: str):
    query = """
    UPDATE common.chat_history 
    SET title = (%s)
    WHERE id = (%s)
    """

    pool = await get_connection_pool()
    async with pool.connection() as conn:
        async with conn.transaction():
            async with conn.cursor() as cur:
                await cur.execute(
                    query,
                    (
                        title,
                        id,
                    ),
                )


async def get_message_history(chat_id: str) -> list[Union[AIMessage, HumanMessage]]:
    query = """
    SELECT 
        role,
        content
    FROM common.message_history
    WHERE chat_id = (%s) AND role IN ('assistant', 'user')
    ORDER BY updated_at ASC
    """

    pool = await get_connection_pool()

    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            resp = await cur.execute(query, (chat_id,))
            res = await resp.fetchall()

    return cast(
        list[Union[AIMessage, HumanMessage]],
        [convert_to_langchain_message(cast(Message, r)) for r in res],
    )


async def get_doc_tokens(doc_ids: List[str]):
    query = """
        SELECT 
            SUM(num_tokens) AS total
        FROM common.document_repo
        WHERE document_id = ANY(%s)
    """

    pool = await get_connection_pool()

    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            resp = await cur.execute(query, (doc_ids,))
            res = await resp.fetchall()

    return res[0]["total"]


async def register_transaction(
    conn: AsyncConnection,
    operation: str,
    prev_value: str,
    current_value: str,
    user_id: str,
    question_id: str,
):
    query = """
        INSERT INTO common.question_history (
            id, operation, prev_value, current_value, user_id, question_id
        ) VALUES (
            %(id)s, %(operation)s, %(prev_value)s, %(current_value)s, %(user_id)s, %(question_id)s
        )
    """

    async with conn.cursor(row_factory=dict_row) as cur:
        await cur.execute(
            query,
            {
                "id": str(uuid4()),
                "operation": operation,
                "prev_value": prev_value,
                "current_value": current_value,
                "user_id": user_id,
                "question_id": question_id,
            },
        )
