import time
from typing import Awaitable, Callable
from fastapi import HTTPException, Request
from starlette.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute=10):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests = {}

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        client_ip = "" if not request.client else request.client.host
        current_time = time.time()

        # Clean old requests
        self.requests = {
            ip: reqs
            for ip, reqs in self.requests.items()
            if current_time - reqs[-1] < 60
        }

        if client_ip in self.requests:
            if len(self.requests[client_ip]) >= self.requests_per_minute:
                raise HTTPException(status_code=429, detail="Too many requests")
            self.requests[client_ip].append(current_time)
        else:
            self.requests[client_ip] = [current_time]

        return await call_next(request)
