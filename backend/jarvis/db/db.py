from psycopg_pool import AsyncConnectionPool
from os import getenv
from dotenv import load_dotenv

load_dotenv()
DB_URI = getenv("DB_URI")
assert DB_URI, "db uri missing!"

_pool = AsyncConnectionPool(
    DB_URI,
    open=False,
    max_size=5,
    kwargs={
        "autocommit": True,
        "prepare_threshold": 0,
    },
)


async def open_connection_pool():
    await _pool.open(wait=True)


async def close_connection_pool():
    if not _pool.closed:
        await _pool.close()


async def get_connection_pool():
    if _pool.closed:
        await open_connection_pool()
    await check_connection_pool()
    return _pool


async def check_connection_pool():
    await _pool.check()
