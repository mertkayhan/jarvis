import asyncio
import itertools
from typing import List
import fitz
import io
from vertexai.generative_models import GenerativeModel, Part, SafetySetting
import logging
import vertexai
from google.api_core.exceptions import ResourceExhausted
from jarvis.blob_storage import resolve_storage
from jarvis.document_parsers.type import ParseResult, ProcessingResult
from jarvis.document_parsers.utils import count_tokens, merge_pages
import vertexai.generative_models
import google.auth


"""
I am about to give up on Gemini as OCR because the safety filters get randomly triggered
due to recitation. There seems to be an open issue on the topic but no updates so far. 
"""

logger = logging.getLogger(__name__)

try:
    _, project_id = google.auth.default()
    vertexai.init(project=project_id, location="europe-west1")
    model = GenerativeModel(
        "gemini-2.0-flash-001",
        safety_settings=[
            SafetySetting(
                category=vertexai.generative_models.HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
                threshold=vertexai.generative_models.HarmBlockThreshold.OFF,
            ),
            SafetySetting(
                category=vertexai.generative_models.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold=vertexai.generative_models.HarmBlockThreshold.OFF,
            ),
            SafetySetting(
                category=vertexai.generative_models.HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold=vertexai.generative_models.HarmBlockThreshold.OFF,
            ),
            SafetySetting(
                category=vertexai.generative_models.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold=vertexai.generative_models.HarmBlockThreshold.OFF,
            ),
            SafetySetting(
                category=vertexai.generative_models.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold=vertexai.generative_models.HarmBlockThreshold.OFF,
            ),
            SafetySetting(
                category=vertexai.generative_models.HarmCategory.HARM_CATEGORY_UNSPECIFIED,
                threshold=vertexai.generative_models.HarmBlockThreshold.OFF,
            ),
        ],
    )
except Exception as err:
    logger.error(f"Failed to initialize vertexai: {err}")
    model = None

bucket = asyncio.Queue(maxsize=100)


async def gemini_pdf_processor(src_path: str, target_path: str) -> ProcessingResult:
    prompt = """
    Extract text from the following PDF page and format it in Markdown.
    
    - Text Content: Preserve headings, paragraphs, and lists accurately.
    - Tables: Convert tables to GitHub-flavored Markdown tables (using | and - for structure).
    - Charts & Graphs: Summarize key insights as concise bullet points.
    - Images & Figures: Provide a brief caption or description instead of a placeholder.
    - Formatting: Maintain proper spacing and structure for readability.
    - No Code Blocks: Do not wrap the output in triple backticks.
    """

    logger.info(f"processing {src_path}")
    storage = resolve_storage()
    pdf_data = storage.read(src_path)

    doc = fitz.open(stream=pdf_data, filetype="pdf")

    async def handler(page_num) -> ParseResult:
        new_doc = fitz.open()
        new_doc.insert_pdf(doc, from_page=page_num, to_page=page_num)
        pdf_buffer = io.BytesIO()
        new_doc.save(pdf_buffer)
        pdf_file = Part.from_data(
            data=pdf_buffer.getvalue(),
            mime_type="application/pdf",
        )
        response = await generate_async_with_backoff(
            contents=[pdf_file, prompt], document_name=src_path, page_number=page_num
        )
        # print(response.text)
        return response

    res = await asyncio.gather(*[handler(page_num) for page_num in range(len(doc))])
    failed = any(iter(r["failed"] for r in res))
    if failed:
        logger.error(f"Failed to process {src_path}")
        return ProcessingResult(
            document_name=src_path,
            failed=True,
            num_tokens=None,
            num_pages=None,
        )
    num_pages = len(res)
    content = merge_pages(res)
    buf = io.BytesIO(content.encode("utf-8"))
    storage.write(buf, target_path)
    logger.info(f"written {target_path}")
    return ProcessingResult(
        document_name=src_path,
        failed=False,
        num_pages=num_pages,
        num_tokens=count_tokens(content),
    )


async def generate_async_with_backoff(
    contents: List, document_name: str, page_number: int
) -> ParseResult:

    temperature = 0
    assert model, "model cannot be None!"

    try:
        await bucket.put(True)
        for i in itertools.count(start=1):
            try:
                if i == 10 or temperature == 2:
                    logger.error("exhausted all retries", exc_info=True)
                    return ParseResult(
                        failed=True,
                        document_name=document_name,
                        page_number=page_number,
                        content=None,
                    )
                res = await model.generate_content_async(
                    contents=contents,
                    generation_config=vertexai.generative_models.GenerationConfig(
                        temperature=temperature,
                        top_p=0.8,
                        max_output_tokens=8192,
                    ),
                )
                try:
                    content = res.text
                except ValueError as err:
                    logger.warning(err)
                    temperature = min(2, temperature + 0.2)
                    continue
                return ParseResult(
                    failed=False,
                    document_name=document_name,
                    page_number=page_number,
                    content=content,
                )
            except ResourceExhausted:
                logger.info(f"Resource exhausted - sleeping {i} sec")
                await asyncio.sleep(i)
            except ValueError as err:
                logger.info(f"retryable error: {err}")
                await asyncio.sleep(i)
            except Exception as err:
                logger.error(
                    f"Gemini processing failed for {document_name} on page {page_number}: {err}",
                    exc_info=True,
                )
                return ParseResult(
                    failed=True,
                    document_name=document_name,
                    page_number=page_number,
                    content=None,
                )

        return ParseResult(
            failed=True,
            document_name=document_name,
            page_number=page_number,
            content=None,
        )
    finally:
        await bucket.get()
