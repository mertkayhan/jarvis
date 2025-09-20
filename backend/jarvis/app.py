import asyncio
import socketio
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

logger.debug(f"CORS_ALLOWED_ORIGINS -> {getenv('CORS_ALLOWED_ORIGINS')}")


async def on_startup():
    await run_migrations()
    asyncio.create_task(run_cleanup(), name="clean_up_task")


async def on_shutdown():
    logger.info("tearing down connection pool")
    await close_connection_pool()


sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=getenv("CORS_ALLOWED_ORIGINS", "").split(";"),
    logger=True,
    engineio_logger=True,
    http_compression=True,
)
sio.register_namespace(Jarvis("/jarvis"))
asgi_app = socketio.ASGIApp(
    sio,
    other_asgi_app=app,
    on_startup=on_startup,
    on_shutdown=on_shutdown,
)


if __name__ == "__main__":
    uvicorn.run(
        "app:asgi_app",
        host=getenv("HOST", "0.0.0.0"),
        port=8000,
        reload=getenv("DEV_SERVER", "").lower() == "true",
    )
