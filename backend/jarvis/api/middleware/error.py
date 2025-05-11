from typing import Awaitable, Callable
from fastapi import HTTPException, Request
from fastapi.responses import ORJSONResponse
from starlette.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        try:
            return await call_next(request)
        except HTTPException as http_err:
            raise http_err
        except Exception as err:
            request_id = getattr(request.state, "request_id", None)
            logger.error(
                f"Operation failed: {err}"
                f"{request_id=} {request.url.path=} {request.method=}",
                exc_info=True,
            )
            return ORJSONResponse(
                status_code=500,
                content={
                    "detail": "Internal server error",
                    "request_id": request_id,  # Include request ID for reference
                },
            )
