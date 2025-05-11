from typing import Awaitable, Callable
from fastapi import Request
from starlette.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware
import time
import logging

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        start_time = time.perf_counter()
        request_id = getattr(request.state, "request_id", None)
        logger.info(
            f"Request started {request.method} {request.url.path}"
            f"{request_id=} {request.method=} {request.url.path=} query_params={str(request.query_params)} client_host={request.client.host if request.client else None} user_agent={request.headers.get('user-agent')}",
        )
        try:
            response = await call_next(request)
            process_time = time.perf_counter() - start_time
            logger.info(
                f"Request completed {request.method} {request.url.path}"
                f"{request_id=} {request.method=} {request.url.path=} {response.status_code=} process_time_ms={round(process_time * 1000, 2)}",
            )
            return response

        except Exception as e:
            process_time = time.perf_counter() - start_time
            logger.exception(
                f"Request failed {request.method} {request.url.path}"
                f"{request_id=} {request.method=} {request.url.path=} error={str(e)} process_time_ms={round(process_time * 1000, 2)}",
            )
            raise
