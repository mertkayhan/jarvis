import asyncio
import socketio
from aiohttp import web
from dotenv import load_dotenv
from os import getenv
import logging
import sys
import logging
import traceback
from jarvis.cleanup.cleanup import run_cleanup
from jarvis.db.db import close_connection_pool
from jarvis.namespaces import Jarvis
from jarvis.db.migrations import run_migrations


logging.basicConfig(
    format="%(asctime)s,%(msecs)d | %(name)s | %(levelname)s | %(message)s",
    datefmt="%H:%M:%S",
    level=logging.INFO,
)

logger = logging.getLogger(__name__)


def log_uncaught_exceptions(exception_type, exception, tb):
    logger.critical("".join(traceback.format_tb(tb)))
    logger.critical("{0}: {1}".format(exception_type, exception))


sys.excepthook = log_uncaught_exceptions

load_dotenv()


async def main():
    await run_migrations()
    logger.debug(f"CORS_ALLOWED_ORIGINS -> {getenv('CORS_ALLOWED_ORIGINS')}")
    sio = socketio.AsyncServer(
        async_mode="aiohttp",
        cors_allowed_origins=getenv("CORS_ALLOWED_ORIGINS").split(";"),
    )
    app = web.Application()
    sio.attach(app)
    sio.register_namespace(Jarvis("/jarvis"))
    loop = asyncio.get_running_loop()
    loop.create_task(run_cleanup(), name="clean_up_task")
    logger.info("Ready to accept connections...")
    web.run_app(app, host=getenv("HOST", "0.0.0.0"), port=8050, loop=loop)
    logger.info("tearing down connection pool")
    await close_connection_pool()


if __name__ == "__main__":
    asyncio.run(main())
