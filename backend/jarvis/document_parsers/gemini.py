import asyncio
import itertools
import os
from typing import List, Optional, TypedDict
import gcsfs
import fitz
import io
from vertexai.generative_models import GenerativeModel, Part, SafetySetting
import logging
from dotenv import load_dotenv
import vertexai
from google.api_core.exceptions import ResourceExhausted
from jarvis.document_parsers.type import ProcessingResult
from jarvis.document_parsers.utils import count_tokens, merge_pages
import vertexai.generative_models


load_dotenv()

logger = logging.getLogger(__name__)

vertexai.init(project=os.getenv("GOOGLE_PROJECT"), location="europe-west1")
model = GenerativeModel(
    "gemini-2.0-flash-001",
    generation_config=vertexai.generative_models.GenerationConfig(
        temperature=0.2,
        top_p=0.8,
        max_output_tokens=8192,
    ),
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

bucket = asyncio.Queue(maxsize=100)


class ParseResult(TypedDict):
    document_name: str
    page_number: int
    content: Optional[str]
    failed: bool


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
    fs = gcsfs.GCSFileSystem(project=os.getenv("GOOGLE_PROJECT"), cache_timeout=0)
    with fs.open(src_path, "rb") as f:
        pdf_data = f.read()

    doc = fitz.open(stream=pdf_data, filetype="pdf")

    async def handler(page_num):
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
        return response.text

    res: List[ParseResult] = await asyncio.gather(
        *[handler(page_num) for page_num in range(len(doc))]
    )
    failed = any(iter(r["failed"] for r in res))
    if failed:
        logger.error(f"Failed to process {src_path}")
        return ProcessingResult(document_name=src_path, failed=True)
    num_pages = len(res)
    content = merge_pages(res)
    with fs.open(target_path, "w") as f:
        f.write(content)
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
    try:
        await bucket.put(True)
        for i in itertools.count(start=1):
            try:
                if i == 10:
                    raise RuntimeError("Exhausted all retries!")
                res = await model.generate_content_async(contents=contents)
                return ParseResult(
                    failed=False,
                    document_name=document_name,
                    page_number=page_number,
                    content=res.text,
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
                    failed=True, document_name=document_name, page_number=page_number
                )
    finally:
        await bucket.get()
