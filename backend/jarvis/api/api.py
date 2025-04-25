import os
from typing import Annotated, Optional
from fastapi import FastAPI, File, UploadFile, Form
import gcsfs
from pydantic import BaseModel
from jarvis.blob_storage.storage import generate_download_signed_url_v4
from jarvis.document_parsers.parser import resolve_parser
from jarvis.queries.query_handlers import insert_doc
from models import ALL_SUPPORTED_MODELS
from fastapi.responses import ORJSONResponse
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)


app = FastAPI(
    title="Jarvis",
    version="0.0.1",
    default_response_class=ORJSONResponse,
)

GOOGLE_PROJECT = os.getenv("GOOGLE_PROJECT")
assert GOOGLE_PROJECT, "'GOOGLE_PROJECT' is not set!"
DOCUMENT_BUCKET = os.getenv("DOCUMENT_BUCKET")
assert DOCUMENT_BUCKET, "'DOCUMENT_BUCKET' is not set!"


class AIModel(BaseModel):
    name: str
    description: Optional[str] = None


class UserModels(BaseModel):
    models: list[AIModel]


@app.get(
    "/api/v1/users/{user_id}/models",
    response_model=UserModels,
)
async def get_available_models(
    user_id: str,
) -> UserModels:
    return UserModels(
        models=[AIModel(name=model_name) for model_name in ALL_SUPPORTED_MODELS]
        + [AIModel(name="automatic")]
    )


@app.get("/api/v1/users/{user_id}/tools")
async def get_available_tools(user_id: str):
    pass


class UploadResult(BaseModel):
    success: bool
    message: str
    num_pages: Optional[int] = None
    num_tokens: Optional[int] = None
    url: Optional[str] = None


@app.post(
    "/api/v1/users/{user_id}/uploads/document",
    response_model=UploadResult,
)
async def upload_document(
    user_id: str,
    fileb: Annotated[UploadFile, File()],
    upload_id: Annotated[str, Form()],
    mode: Annotated[str, Form()],
) -> UploadResult:
    # TODO:
    # Security:
    # Input Validation: Missing input validation for user_id, upload_id, and fname can lead to injection attacks.
    # File Size Limits: Implement file size limits to prevent denial-of-service.
    # File Type Validation: Validate file content (e.g., using libmagic) to prevent malicious uploads, not just the extension.
    # Asynchronous Processing: Parsing is synchronous, potentially causing timeouts for large files. Use a background task queue (Celery, Redis Queue) for asynchronous processing.
    # GCS Dependency: Tightly coupled to GCS. Abstract the storage mechanism for easier switching to other solutions.

    logger.info(f"received document {fileb.filename} for user {user_id}")

    try:
        target_path = f"{DOCUMENT_BUCKET}/raw/{user_id}/{upload_id}/{fileb.filename}"
        print(fileb.file)
        fs = gcsfs.GCSFileSystem(project=GOOGLE_PROJECT)  # type: ignore
        with fs.open(target_path, "wb") as f:
            f.write(fileb.file.read())  # type: ignore
    except Exception as err:
        logger.error(f"raw document upload failed: {err}", exc_info=True)
        return UploadResult(success=False, message="document upload failed")

    logger.info("raw upload completed")
    logger.info("will start parsing")

    # .csv,.txt,.pdf,.xlsx supported
    try:
        parsers = resolve_parser(fileb.filename)  # TODO:
        source_path = f"{DOCUMENT_BUCKET}/raw/{user_id}/{upload_id}/{fileb.filename}"
        target_path = source_path.replace("raw", "parsed") + ".md"
        processing_mode = mode
        idx = next(i for i, v in enumerate(parsers) if v.kind == processing_mode)
        parser = parsers[idx]
        res = await parser(src_path=source_path, target_path=target_path)
        if res["failed"]:
            raise ValueError(f"processing failed for {res['document_name']}")
        logger.info("inserting doc into db")
        await insert_doc(
            upload_id,
            fileb.filename,
            user_id,
            res["num_pages"],
            res["num_tokens"],
        )
        logger.info("document processing done")
        return UploadResult(
            success=True,
            message=f"document_done_{fileb.filename}_{user_id}",
            num_pages=res["num_pages"],
            num_tokens=res["num_tokens"],
            url=generate_download_signed_url_v4(
                GOOGLE_PROJECT,  # type: ignore
                DOCUMENT_BUCKET,  # type: ignore
                f"raw/{user_id}/{upload_id}/{fileb.filename}",
            ),
        )
    except TypeError as err:
        logger.error(f"document processing failed: {err}", exc_info=True)
        return UploadResult(success=False, message="unknown document type")
    except Exception as err:
        logger.error(f"document processing failed: {err}", exc_info=True)
        return UploadResult(success=False, message="document processing failed")


# @app.get("/api/v1/users/{user_id}/chats/{chat_id}/messages")
# async def get_chat_messages(user_id: str, chat_id: str, deleted: bool = False):
#     pass


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


# @app.delete("/api/v1/users/{user_id}/chats/{chat_id}/messages/{message_id}")
# async def delete_message(user_id: str, chat_id: str, message_id: str):
#     pass


# @app.delete("/api/v1/users/{user_id}/chats")
# async def delete_all_user_chats(user_id: str):
#     pass


# class ChatTitleUpdate(BaseModel):
#     new_title: str


# @app.patch("/api/v1/users/{user_id}/chats/{chat_id}/title")
# async def update_chat_title(user_id: str, chat_id: str, payload: ChatTitleUpdate):
#     pass


# @app.delete("/api/v1/users/{user_id}/chats/{chat_id}")
# async def delete_chat(user_id: str, chat_id: str):
#     pass


# @app.get("/api/v1/users/{user_id}/docs")
# async def get_user_docs(user_id: str, deleted: bool = False):
#     pass


# @app.delete("/api/v1/users/{user_id}/docs/{doc_id}")
# async def delete_doc(user_id: str, doc_id: str):
#     pass


# @app.get("/api/v1/users/{user_id}/model-selection")
# async def get_user_model_selection(user_id: str):
#     pass


# class UserModelSelection(BaseModel):
#     model_name: str


# @app.post("/api/v1/users/{user_id}/model-selection")
# async def set_user_model_selection(user_id: str, payload: UserModelSelection):
#     pass


# @app.get("/api/v1/users/{user_id}/personalities")
# async def get_user_personalities(user_id: str):
#     pass


# class UserPersonality(BaseModel):
#     personality_id: str
#     # TODO:


# @app.post("/api/v1/users/{user_id}/personalities")
# async def create_personality(user_id: str, payload: UserPersonality):
#     pass


# @app.delete("/api/v1/users/{user_id}/personalities/{personality_id}")
# async def delete_personality(user_id: str, personality_id: str):
#     pass


# @app.put("/api/v1/users/{user_id}/personalities/{personality_id}")
# async def update_personality(
#     user_id: str, personality_id: str, payload: UserPersonality
# ):
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


# @app.get("/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions")
# async def get_question_pack_questions(
#     user_id: str, question_pack_id: str, deleted: bool = False
# ):
#     pass


# class Question(BaseModel):
#     question: str


# @app.post("/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions")
# async def create_question(user_id: str, question_pack_id: str, payload: Question):
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
