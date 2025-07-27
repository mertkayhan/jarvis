import logging
from typing import Optional
from jarvis.db.db import check_connection_pool, get_connection_pool
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver


class Memory:
    saver: Optional[AsyncPostgresSaver] = None
    logger = logging.getLogger(__name__)

    @classmethod
    async def setup(cls):
        cls.logger.info("setting up memory")
        pool = await get_connection_pool()
        cls.saver = AsyncPostgresSaver(pool)  # type: ignore
        await cls.saver.setup()

    @classmethod
    async def check(cls):
        cls.logger.info("checking db connections...")
        await check_connection_pool()
