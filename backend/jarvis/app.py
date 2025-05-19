import asyncio
import signal
from typing import Callable
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
from multiprocessing import Process


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


class ProcessManager:
    def __init__(self):
        self.processes = {}
        self.active = True
        signal.signal(signal.SIGTERM, self.handle_shutdown)
        signal.signal(signal.SIGINT, self.handle_shutdown)

    def start_process(self, name: str, fn: Callable):
        process = Process(target=fn)
        process.start()
        self.processes[name] = process
        logger.info(f"Started {name} service (PID: {process.pid})")

    def check_process_health(self):
        for name, process in self.processes.items():
            if not process.is_alive():
                logger.error(f"{name} service died, shutting down all services...")
                self.handle_shutdown(None, None)
                sys.exit(1)

    def handle_shutdown(self, signum, frame):
        logger.info("Shutting down all processes...")
        self.running = False
        for name, process in self.processes.items():
            logger.info(f"Stopping {name} service...")
            process.terminate()
            process.join(timeout=5)
            if process.is_alive():
                logger.warning(f"Force killing {name} service...")
                process.kill()
                process.join()


def run_websocket():
    sio = socketio.AsyncServer(
        async_mode="aiohttp",
        cors_allowed_origins=getenv("CORS_ALLOWED_ORIGINS", "").split(";"),
        logger=True,
        engineio_logger=True,
        http_compression=True,
    )
    sio.register_namespace(Jarvis("/jarvis"))
    app = web.Application()
    sio.attach(app)
    web.run_app(
        app,
        host=getenv("HOST", "0.0.0.0"),
        port=8001,
        access_log_format='%a %t "%r" %s %b "%{Referer}i" "%{User-Agent}i" %Tf',
    )


def run_api():
    uvicorn.run(
        app,
        host=getenv("HOST", "0.0.0.0"),
        port=8000,
    )


async def main():
    await run_migrations()
    asyncio.create_task(run_cleanup(), name="clean_up_task")

    manager = ProcessManager()

    try:
        manager.start_process("websocket", run_websocket)
        manager.start_process("api", run_api)

        while True:
            manager.check_process_health()
            await asyncio.sleep(5)
    except Exception as err:
        logger.error(f"Error in main process: {err}", exc_info=True)
        raise RuntimeError from err
    finally:
        manager.handle_shutdown(None, None)
        logger.info("tearing down connection pool")
        await close_connection_pool()


if __name__ == "__main__":
    asyncio.run(main())
