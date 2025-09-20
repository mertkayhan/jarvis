import os
from fastapi import FastAPI
from fastapi.responses import ORJSONResponse
from dotenv import load_dotenv
import logging
from fastapi.middleware.cors import CORSMiddleware
from jarvis.api.middleware import *
from jarvis.api.routers import *


load_dotenv()

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Jarvis",
    version="0.0.1",
    default_response_class=ORJSONResponse,
)

origins = os.getenv("CORS_ALLOWED_ORIGINS", "").split(";")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(ErrorHandlingMiddleware)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(AuthMiddleware)
app.add_middleware(RateLimitMiddleware, requests_per_minute=60)
app.add_middleware(SecurityHeadersMiddleware)
app.include_router(chat_router)
app.include_router(doc_router)
app.include_router(personality_router)
app.include_router(misc_router)
app.include_router(document_pack_router)
