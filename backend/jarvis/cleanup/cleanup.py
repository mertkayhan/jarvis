import asyncio
import logging
from typing import List
import gcsfs
from jarvis.db.db import get_connection_pool
from psycopg.rows import dict_row, DictRow
from os import getenv
from dotenv import load_dotenv
from pathlib import Path
import shutil


logger = logging.getLogger(__name__)
load_dotenv()

DOCUMENT_BUCKET = getenv("DOCUMENT_BUCKET")
assert DOCUMENT_BUCKET, "DOCUMENT_BUCKET is not set!"


async def run_cleanup():
    while True:
        logger.info("triggering cleanup")
        try:
            await clean_old_chats()
            await clean_old_docs()
            await clean_old_personalities()
            await clean_old_question_packs()
            await clean_old_questions()
            await clean_old_document_packs()
            logger.info("cleanup done")
        except Exception as err:
            logger.error(f"cleanup failed with {err}", exc_info=True)
        await asyncio.sleep(24 * 3600)


async def clean_old_chats():
    query = """
    DELETE FROM common.chat_history 
    WHERE deleted = TRUE AND updated_at < (CURRENT_DATE - INTERVAL '30 days')
    RETURNING id
    """

    logger.info("cleaning up old chats")
    await executor(query)


async def clean_old_docs():
    query = """
    DELETE FROM common.document_repo
    WHERE deleted = TRUE AND updated_at < (CURRENT_DATE - INTERVAL '30 days')
    RETURNING document_id, document_name, owner
    """

    logger.info("cleaning up old docs")
    res = await executor(query)
    fs = gcsfs.GCSFileSystem(project=getenv("GOOGLE_PROJECT"), cache_timeout=0)
    for r in res:
        logger.info(f"deleting {r['document_name']}")
        fs.rm_file(
            f"{DOCUMENT_BUCKET}/raw/{r['owner']}/{r['document_id']}/{r['document_name']}"
        )
        fs.rm_file(
            f"{DOCUMENT_BUCKET}/parsed/{r['owner']}/{r['document_id']}/{r['document_name']}.md"
        )


async def clean_old_personalities():
    query = """
    DELETE FROM common.personalities
    WHERE deleted = TRUE AND updated_at < (CURRENT_DATE - INTERVAL '30 days')
    RETURNING id
    """

    logger.info("cleaning old personalities")
    await executor(query)


async def clean_old_question_packs():
    query = """
    DELETE FROM common.question_packs
    WHERE deleted = TRUE AND updated_at < (CURRENT_DATE - INTERVAL '30 days')
    RETURNING id
    """

    logger.info("cleaning old question packs")
    await executor(query)


async def clean_old_questions():
    query = """
    DELETE FROM common.question_pairs
    WHERE deleted = TRUE AND updated_at < (CURRENT_DATE - INTERVAL '30 days')
    RETURNING id
    """

    logger.info("cleaning old questions")
    await executor(query)


async def executor(query: str) -> List[DictRow]:
    pool = await get_connection_pool()

    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            async with conn.transaction():
                res_future = await cur.execute(query)
                res = await res_future.fetchall()
    return res


async def clean_old_document_packs():
    query = """
    DELETE FROM common.question_packs
    WHERE deleted = TRUE AND updated_at < (CURRENT_DATE - INTERVAL '30 days')
    RETURNING id
    """

    logger.info("deleting old document packs...")
    res = await executor(query)
    base = Path("/tmp/jarvis")
    for r in res:
        to_delete = base / Path(r)
        logger.info(f"deleting {to_delete}...")
        shutil.rmtree(to_delete.as_posix(), ignore_errors=True)
