import logging

from jarvis.db.db import get_connection_pool

logger = logging.getLogger(__name__)


async def run_migrations():
    logger.info("starting db migrations")

    with open("jarvis/db/migration_sql/jarvis.sql") as f:
        sql = f.read()

    pool = await get_connection_pool()
    async with pool.connection() as conn:
        async with conn.transaction():
            async with conn.cursor() as cur:
                await cur.executemany(sql, params_seq=[])

    logger.info("completed migrations")
