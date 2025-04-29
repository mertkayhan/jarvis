import asyncio
import datetime
import json
import os
from typing import Annotated, Any, Dict, Optional
from uuid import UUID, uuid4
from fastapi import (
    Depends,
    FastAPI,
    File,
    UploadFile,
    Form,
    Request,
    HTTPException,
    Query,
)
from fastapi.security import HTTPBearer
import gcsfs
from psycopg import AsyncConnection
from pydantic import BaseModel
from jarvis.auth.auth import validate_token
from jarvis.blob_storage.storage import generate_download_signed_url_v4
from jarvis.db.db import get_connection_pool
from jarvis.document_parsers.parser import resolve_parser
from jarvis.queries.query_handlers import insert_doc, register_transaction
from jarvis.question_pack.retriever import generate_embedding
from jarvis.tools import ALL_AVAILABLE_TOOLS
from models import ALL_SUPPORTED_MODELS
from fastapi.responses import ORJSONResponse
from dotenv import load_dotenv
import logging
from psycopg.rows import dict_row


load_dotenv()

logger = logging.getLogger(__name__)


class JWTBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super(JWTBearer, self).__init__(auto_error=auto_error)

    async def __call__(self, request: Request):
        credentials = await super(JWTBearer, self).__call__(request)
        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(
                    status_code=403, detail="Invalid authentication scheme."
                )
            if not self.verify_jwt(credentials.credentials):
                raise HTTPException(
                    status_code=403, detail="Invalid token or expired token."
                )
            return credentials
        else:
            raise HTTPException(status_code=403, detail="Invalid authorization code.")

    def verify_jwt(self, token: str) -> bool:
        try:
            validate_token(token)
            return True
        except Exception as err:
            logger.error(f"failed to validate bearer token: {err}", exc_info=True)
            return False


app = FastAPI(
    title="Jarvis",
    version="0.0.1",
    default_response_class=ORJSONResponse,
    dependencies=[Depends(JWTBearer())],
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


class SystemPrompt(BaseModel):
    name: str
    description: str
    instructions: str
    tools: list[str]


@app.get(
    "/api/v1/users/{user_id}/default-prompt",
    response_model=SystemPrompt,
)
async def get_default_system_prompt(user_id: str) -> SystemPrompt:
    # TODO: return user system prompt
    return SystemPrompt(
        name="default",
        description="This is the default system prompt for Jarvis.",
        instructions=f"""
        The assistant is Jarvis.

        The current date is {datetime.datetime.now(datetime.timezone.utc).isoformat()}.

        ## Thought Process & Reasoning
        - When faced with a math, logic, or complex reasoning problem, Jarvis systematically thinks through the problem step by step before delivering a final answer.
        - Jarvis provides thorough responses to complex or open-ended questions and concise responses to simpler tasks.

        ## Information Extraction & Prioritization
        - **Primary Source**: When a question pack is available, prioritize extracting relevant information from it before considering other sources or asking the user for additional details.
        - **Fallback Strategy**: If the question pack does not contain the necessary information, then proceed to ask the user for more specific details or use other available tools, such as web search.
        - **Clarification**: Only ask the user for additional information if the question pack and other tools do not provide a satisfactory answer.
    
        ## Conversational Approach
        - Jarvis engages in **authentic, natural conversations**, responding to the user's input, asking relevant follow-up questions only when necessary.
        - Jarvis avoids excessive questioning and ensures a balanced dialogue.
        - Jarvis adapts its tone and style to the user's preference and context.

        ## Capabilities & Tools
        - Jarvis assists with **analysis, question answering, coding, document understanding, creative writing, teaching, and general discussions**.
        - Jarvis retrieves up-to-date information from the web using Google Search when necessary.
        - If analyzing a document it does not have access to, Jarvis prompts the user to upload it to the Document Repository. The user must attach the processed document for analysis.

        ## Formatting & Usability
        - Jarvis follows best practices for **Markdown formatting** to enhance clarity and readability.
        - Jarvis continuously improves based on user feedback.

        ## Language Adaptability
        - Jarvis follows these instructions in all languages and responds in the language the user uses or requests.
        """,
        tools=ALL_AVAILABLE_TOOLS,
    )


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


class ToolSet(BaseModel):
    tools: list[str]


@app.get("/api/v1/users/{user_id}/tools", response_model=ToolSet)
async def get_available_tools(user_id: str) -> ToolSet:
    return ToolSet(tools=ALL_AVAILABLE_TOOLS)


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


class Question(BaseModel):
    question: str


class CreateQuestionResp(BaseModel):
    id: str
    question: str


@app.post("/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions")
async def create_question(user_id: str, question_pack_id: str, payload: Question):
    query = """
        INSERT INTO common.question_pairs(
            id, pack_id, question, updated_by, answer, question_embedding
        ) values(
            %(question_id)s, %(question_pack_id)s, %(question)s, %(user_id)s, %(dummy)s, %(vector)s
        )
        RETURNING id
    """

    async def insert_question(conn: AsyncConnection) -> CreateQuestionResp:
        async with conn.cursor(row_factory=dict_row) as cur:
            resp = await cur.execute(
                query,
                {
                    "question_id": question_id,
                    "question_pack_id": question_pack_id,
                    "question": payload.question,
                    "user_id": user_id,
                    "dummy": "",
                    "vector": question_embedding,
                },
            )
            res = await resp.fetchall()
            id = res[0]["id"]
            assert str(id) == question_id, "Internal error!"
            return CreateQuestionResp(id=question_id, question=payload.question)

    try:
        question_embedding = await generate_embedding(payload.question)
        question_id = str(uuid4())
        pool = await get_connection_pool()

        async with pool.connection() as conn:
            async with conn.transaction():
                return await insert_question(conn)
    except Exception as err:
        logger.error(f"failed to create new question: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to create question due to internal error, please check the server logs for more information.",
        )


class UserQuestion(BaseModel):
    id: UUID
    metadata: Optional[str] = None
    question: str
    answer: str
    updatedAt: datetime.datetime
    updatedBy: str


class QuestionList(BaseModel):
    questions: list[UserQuestion]
    maxPageNo: int


@app.get("/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions")
async def get_question_pack_questions(
    user_id: str,
    question_pack_id: str,
    offset: int = 0,
    limit: int = 10,
    deleted: bool = False,
    tags: Annotated[Optional[list[str]], Query()] = None,
    additional_info: Annotated[Optional[list[str]], Query()] = None,
    search_query: Optional[str] = None,
) -> QuestionList:
    try:
        # build tag filter
        tag_list = None if not tags else tags
        tag_filter = "" if not tag_list else "tag = ANY(%(tags)s)"

        # build additional info filter
        additional_info_list = (
            None
            if not additional_info
            else [json.loads(element) for element in additional_info]
        )
        additional_info_filter = (
            ""
            if not additional_info_list
            else "("
            + " OR ".join(
                [
                    f"(key = %(key{i})s AND value = ANY(%(value{i})s))"
                    for i in range(len(additional_info_list))
                ]
            )
            + ")"
        )

        # construct the query params
        additional_info_query_params = {}
        for i, element in enumerate(additional_info_list or []):
            additional_info_query_params[f"key{i}"] = element["key"]
            additional_info_query_params[f"value{i}"] = element["value"].split(",")

        # build similarity filter
        similarity_filter = (
            ""
            if not search_query
            else "(1 - (question_embedding <=> %(vector)s::vector)) > 0.3 OR x.question_tsv @@ plainto_tsquery('english', %(search_query)s)"
        )

        # build similarity column
        similarity_col = (
            ""
            if not search_query
            else "(0.7 * (1 - (question_embedding <=> %(vector)s::vector)) + 0.3 * ts_rank_cd(x.question_tsv, plainto_tsquery('english', %(search_query)s))) AS similarity"
        )
        real_offset = offset * limit
        query_vector = (
            None if not search_query else await generate_embedding(search_query)
        )

        question_count_query = f"""
            SELECT COUNT(DISTINCT x.*)
            FROM common.question_pairs x 
            LEFT JOIN common.question_tags y
            ON x.id = y.question_id
            LEFT JOIN common.question_additional_info z
            ON x.id = z.question_id
            WHERE x.deleted = %(deleted)s 
                AND x.pack_id = %(question_pack_id)s
                {"AND" if len(tag_filter) > 0 else ""} {tag_filter} 
                {"AND" if len(additional_info_filter) > 0 else ""} {additional_info_filter}
                {"AND" if len(similarity_filter) > 0 else ""} {similarity_filter}
        """

        list_question_query = f"""
            SELECT 
                DISTINCT x.id,
                x.answer, 
                x.question, 
                x.updated_at,
                x.updated_by {"," if len(similarity_col) > 0 else ""}
                {similarity_col}
            FROM common.question_pairs x
            LEFT JOIN common.question_tags y 
            ON x.id = y.question_id 
            LEFT JOIN common.question_additional_info z 
            ON x.id = z.question_id
            WHERE x.deleted = %(deleted)s 
                AND x.pack_id = %(question_pack_id)s
                {"AND" if len(tag_filter) > 0 else ""} {tag_filter} 
                {"AND" if len(additional_info_filter) > 0 else ""} {additional_info_filter}
                {"AND" if len(similarity_filter) > 0 else ""} {similarity_filter}
            ORDER BY x.updated_at DESC {", similarity DESC" if len(similarity_col) > 0 else ""}
            LIMIT %(limit)s
            OFFSET %(offset)s
        """

        logger.info(f"query:\n{list_question_query}")

        async def list_questions(conn: AsyncConnection) -> list[Dict[str, Any]]:
            async with conn.cursor(row_factory=dict_row) as cur:
                resp = await cur.execute(
                    list_question_query,
                    {
                        "tags": tag_list,
                        "vector": query_vector,
                        "search_query": search_query,
                        "limit": limit,
                        "offset": real_offset,
                        "deleted": deleted,
                        "question_pack_id": question_pack_id,
                        **additional_info_query_params,
                    },
                )
                res = await resp.fetchall()
                return res

        async def count_questions(conn: AsyncConnection):
            async with conn.cursor(row_factory=dict_row) as cur:
                resp = await cur.execute(
                    question_count_query,
                    {
                        "tags": tag_list,
                        "vector": query_vector,
                        "search_query": search_query,
                        "deleted": deleted,
                        "question_pack_id": question_pack_id,
                        **additional_info_query_params,
                    },
                )
                res = await resp.fetchall()
                return res[0]["count"]

        pool = await get_connection_pool()
        async with pool.connection() as conn:
            [question_list, question_count] = await asyncio.gather(
                list_questions(conn),
                count_questions(conn),
            )
            return QuestionList(
                maxPageNo=((question_count - 1) // limit) + 1,
                questions=[
                    UserQuestion(
                        id=r["id"],
                        answer=r["answer"],
                        question=r["question"],
                        updatedAt=r["updated_at"],
                        updatedBy=r["updated_by"],
                    )
                    for r in question_list
                ],
            )
    except Exception as err:
        logger.error(f"failed to list questions: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to list questions due to internal error, please check the server logs for more information.",
        )


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
