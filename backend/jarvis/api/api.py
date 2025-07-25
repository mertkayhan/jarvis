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
auth_provider = os.getenv("AUTH0_ISSUER_BASE_URL")
if auth_provider:
    origins.append(auth_provider)

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
app.include_router(question_pack_router)
app.include_router(personality_router)
app.include_router(misc_router)


# @app.get("/api/v1/users/{user_id}/chats")
# async def get_user_chats(user_id: str, deleted: bool = False):
#     pass


# @app.get("/api/v1/users/{user_id}/document-packs")
# async def get_user_document_packs(user_id: str, deleted: bool = False):
#     pass


# class DocumentPack(BaseModel):
#     document_pack_id: str
#     name: str
#     description: str


# @app.post("/api/v1/users/{user_id}/document-packs")
# async def create_document_pack(user_id: str, payload: DocumentPack):
#     pass


# @app.put("/api/v1/users/{user_id}/document-packs/{document_pack_id}")
# async def update_document_pack(
#     user_id: str, document_pack_id: str, payload: DocumentPack
# ):
#     pass


# @app.delete("/api/v1/users/{user_id}/document-packs/{document_pack_id}")
# async def delete_document_pack(user_id: str, document_pack_id: str):
#     pass


# @app.get("/api/v1/users/{user_id}/chats/{chat_id}")
# async def get_chat(user_id: str, chat_id: str):
#     pass


# @app.post("/api/v1/global/personalities/{personality_id}/global")
# async def make_personality_global(personality_id: str):
#     pass


# @app.post("/api/v1/users/{user_id}/personalities/{personality_id}/default")
# async def make_personality_default(user_id: str, personality_id: str):
#     pass


# @app.delete("/api/v1/users/{user_id}/personalities/{personality_id}/default")
# async def unset_default_personality(user_id: str, personality_id: str):
#     pass


# @app.get("/api/v1/users/{user_id}/personalities/default")
# async def get_default_personality(user_id: str):
#     pass


# class QuestionPack(BaseModel):
#     question_pack_id: str
#     name: str
#     description: str


# @app.post("/api/v1/users/{user_id}/question-packs")
# async def create_question_pack(user_id: str, payload: QuestionPack):
#     pass


# @app.get("/api/v1/users/{user_id}/question-packs")
# async def get_user_question_packs(user_id: str, deleted: bool = False):
#     pass


# @app.delete("/api/v1/users/{user_id}/question-packs/{question_pack_id}")
# async def delete_question_pack(user_id: str, question_pack_id: str):
#     pass


# @app.put("/api/v1/users/{user_id}/question-packs/{question_pack_id}")
# async def update_question_pack(
#     user_id: str, question_pack_id: str, payload: QuestionPack
# ):
#     pass


# @app.delete(
#     "/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions/{question_id}"
# )
# async def delete_question(user_id: str, question_pack_id: str, question_id: str):
#     pass


# class Answer(BaseModel):
#     answer: str


# @app.patch(
#     "/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions/{question_id}/answer"
# )
# async def update_answer(
#     user_id: str, question_pack_id: str, question_id: str, payload: Answer
# ):
#     pass


# @app.patch(
#     "/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions/{question_id}/question"
# )
# async def update_question(
#     user_id: str, question_pack_id: str, question_id: str, payload: Question
# ):
#     pass


# @app.get(
#     "/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions/{question_id}/tags"
# )
# async def get_question_tags(user_id: str, question_pack_id: str, question_id: str):
#     pass


# class Tag(BaseModel):
#     tag: str
#     tag_id: str


# @app.post(
#     "/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions/{question_id}/tags"
# )
# async def create_question_tag(
#     user_id: str, question_pack_id: str, question_id: str, payload: Tag
# ):
#     pass


# @app.delete(
#     "/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions/{question_id}/tags/{tag_id}"
# )
# async def delete_question_tag(
#     user_id: str, question_pack_id: str, question_id: str, tag_id: str
# ):
#     pass


# @app.get(
#     "/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions/{question_id}/additional-info"
# )
# async def get_question_additional_info(
#     user_id: str, question_pack_id: str, question_id: str
# ):
#     pass


# class AdditionalInfo(BaseModel):
#     id: str
#     key: str
#     value: str


# @app.post(
#     "/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions/{question_id}/additional-info"
# )
# async def create_question_additional_info(
#     user_id: str, question_pack_id: str, question_id: str, payload: AdditionalInfo
# ):
#     pass


# @app.delete(
#     "/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions/{question_id}/additional-info/{additional_info_id}"
# )
# async def delete_question_additional_info(
#     user_id: str, question_pack_id: str, question_id: str, additional_info_id: str
# ):
#     pass


# @app.get(
#     "/api/v1/users/{user_id}/question-packs/{question_pack_id}/additional-info/filterable-keys"
# )
# async def get_additional_info_keys(user_id: str, question_pack_id: str):
#     pass


# @app.get(
#     "/api/v1/users/{user_id}/question-packs/{question_pack_id}/additional-info/filterable-values"
# )
# async def get_additional_info_values(user_id: str, question_pack_id: str):
#     pass


# @app.get("/api/v1/users/{user_id}/question-packs/{question_pack_id}/filterable-tags")
# async def get_all_tags(user_id: str, question_pack_id: str):
#     pass


# @app.get(
#     "/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions/{question_id}/history"
# )
# async def get_question_history(user_id: str, question_pack_id: str, question_id: str):
#     pass
