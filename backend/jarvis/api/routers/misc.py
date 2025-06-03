import datetime
from typing import Annotated, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Form, HTTPException, Request, UploadFile
import logging
from psycopg.rows import dict_row
from jarvis.blob_storage import resolve_storage
from jarvis.db.db import get_connection_pool
from jarvis.document_parsers.parser import resolve_parser
from jarvis.models import ALL_SUPPORTED_MODELS
from jarvis.models.models import get_default_model
from jarvis.queries.query_handlers import insert_doc
from jarvis.tools import ALL_AVAILABLE_TOOLS


router = APIRouter()
logger = logging.getLogger(__name__)


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


@router.get(
    "/api/v1/default-prompt",
    response_model=SystemPrompt,
)
async def get_default_system_prompt(req: Request) -> SystemPrompt:
    user_id: str = req.state.claims["sub"]
    logger.info(f"{user_id} is requesting the default system prompt")
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


@router.get(
    "/api/v1/models",
    response_model=UserModels,
)
async def get_available_models() -> UserModels:
    return UserModels(
        models=[AIModel(name=model_name) for model_name in ALL_SUPPORTED_MODELS]
    )


class ToolSet(BaseModel):
    tools: list[str]


@router.get("/api/v1/tools", response_model=ToolSet)
async def get_available_tools() -> ToolSet:
    return ToolSet(tools=ALL_AVAILABLE_TOOLS)


class UploadResult(BaseModel):
    success: bool
    message: str
    num_pages: Optional[int] = None
    num_tokens: Optional[int] = None
    url: Optional[str] = None


@router.post(
    "/api/v1/uploads/document",
    response_model=UploadResult,
)
async def upload_document(
    req: Request,
    fileb: UploadFile,
    upload_id: Annotated[str, Form()],
    mode: Annotated[str, Form()],
    module: Annotated[str, Form()],
    pack_id: Annotated[Optional[str], Form()] = None,
) -> UploadResult:
    # TODO:
    # Security:
    # Input Validation: Missing input validation for user_id, upload_id, and fname can lead to injection attacks.
    # File Size Limits: Implement file size limits to prevent denial-of-service.
    # File Type Validation: Validate file content (e.g., using libmagic) to prevent malicious uploads, not just the extension.

    user_id: str = req.state.claims["sub"]
    logger.info(f"received document {fileb.filename} for user {user_id}")

    try:
        storage = resolve_storage()
        if module == "document_repo":
            target_path = f"raw/{user_id}/{upload_id}/{fileb.filename}"
        elif module == "document_pack" and pack_id is not None:
            target_path = f"document_packs/{pack_id}/raw/{fileb.filename}"
        else:
            raise ValueError("unknown module")
        storage.write(fileb.file, target_path)
    except Exception as err:
        logger.error(f"raw document upload failed: {err}", exc_info=True)
        return UploadResult(success=False, message="document upload failed")

    logger.info("raw upload completed")
    logger.info("will start parsing")

    # .csv,.txt,.pdf,.xlsx supported
    try:
        parsers = resolve_parser(fileb.filename)  # TODO:
        source_path = f"raw/{user_id}/{upload_id}/{fileb.filename}"
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
            url=storage.generate_presigned_url(
                f"raw/{user_id}/{upload_id}/{fileb.filename}",
            ),
        )
    except TypeError as err:
        logger.error(f"document processing failed: {err}", exc_info=True)
        return UploadResult(success=False, message="unknown document type")
    except Exception as err:
        logger.error(f"document processing failed: {err}", exc_info=True)
        return UploadResult(success=False, message="document processing failed")


class UserModel(BaseModel):
    model: str


@router.get("/api/v1/model-selection", response_model=UserModel)
async def get_user_model_selection(req: Request) -> UserModel:
    user_id: str = req.state.claims["sub"]
    query = """
        SELECT 
            model_name,
            user_id
        FROM common.model_selection 
        WHERE user_id = (%s)
    """
    try:
        pool = await get_connection_pool()
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=dict_row) as cur:
                resp = await cur.execute(query, (user_id,))
                res = await resp.fetchall()
                return UserModel(
                    model=res[0]["model_name"] if res else get_default_model()
                )
    except Exception as err:
        logger.error(f"failed to get user model: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="failed to get user model, for more details please refer to the server logs",
        )


class UserModelSelection(BaseModel):
    model_name: str


class SetModelResult(BaseModel):
    model: str


@router.post("/api/v1/model-selection", response_model=SetModelResult)
async def set_user_model_selection(
    req: Request,
    payload: UserModelSelection,
) -> SetModelResult:
    user_id: str = req.state.claims["sub"]
    query = """
        INSERT INTO common.model_selection (
            user_id, model_name
        ) VALUES (
            %(user_id)s, %(model_name)s
        )
        ON CONFLICT(user_id)
        DO UPDATE 
        SET model_name = EXCLUDED.model_name
        RETURNING user_id, model_name
    """
    try:
        pool = await get_connection_pool()
        async with pool.connection() as conn:
            async with conn.transaction():
                async with conn.cursor(row_factory=dict_row) as cur:
                    resp = await cur.execute(
                        query,
                        {
                            "user_id": user_id,
                            "model_name": payload.model_name,
                        },
                    )
                    res = await resp.fetchall()
                    return SetModelResult(model=res[0]["model_name"])
    except Exception as err:
        logger.error(f"failed to update user model: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="failed to update user model, please refer to server logs for further information",
        )
