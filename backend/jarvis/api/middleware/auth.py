from fastapi.security import HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Awaitable, Callable
from fastapi import HTTPException, Request
from starlette.responses import Response
import logging
from jarvis.auth.auth import Claims, validate_token


logger = logging.getLogger(__name__)


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        # skip CORS preflight requests
        if request.method == "OPTIONS":
            return await call_next(request)

        credentials = await HTTPBearer()(request)
        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(
                    status_code=403, detail="Invalid authentication scheme."
                )
            try:
                claims = self.verify_jwt(credentials.credentials)
                if not claims["sub"]:
                    raise ValueError("user id is missing from token")
                request.state.claims = claims
                return await call_next(request)
            except Exception as err:
                logger.error(f"failed to validate token: {err}", exc_info=True)
                raise HTTPException(
                    status_code=403, detail="Invalid token or expired token."
                )
        else:
            raise HTTPException(status_code=403, detail="Invalid authorization code.")

    def verify_jwt(self, token: str) -> Claims:
        return validate_token(token)
