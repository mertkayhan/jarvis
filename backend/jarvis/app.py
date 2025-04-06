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
from jarvis.api.api import app
import uvicorn


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
        async_mode="asgi",
        cors_allowed_origins=getenv("CORS_ALLOWED_ORIGINS").split(";"),
    )
    app.mount("/", socketio.ASGIApp(sio, app))
    sio.register_namespace(Jarvis("/jarvis"))
    asyncio.create_task(run_cleanup(), name="clean_up_task")
    logger.info("Ready to accept connections...")
    uvicorn.run(app, host=getenv("HOST", "0.0.0.0"), port=8000)
    logger.info("tearing down connection pool")
    await close_connection_pool()


if __name__ == "__main__":
    asyncio.run(main())
