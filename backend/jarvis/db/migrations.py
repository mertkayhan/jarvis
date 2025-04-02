import logging
import psycopg
from jarvis.db.db import get_connection_pool
import yaml

logger = logging.getLogger(__name__)


async def run_migrations():
    logger.info("starting db migrations")

    with open("jarvis/db/revisions/revisions.yaml", "rb") as f:
        revisions = yaml.safe_load(f).get("revisions", [])

    for revision in revisions:
        logger.info(f"applying revision {revision}")
        with open(f"jarvis/db/revisions/{revision}/jarvis.sql") as f:
            script = f.read()
        pool = await get_connection_pool()
        async with pool.connection() as conn:
            async with conn.transaction():
                cur = psycopg.AsyncClientCursor(conn)
                await cur.execute(script)

    logger.info("completed migrations")
