import asyncio
import itertools
import os
from typing import List
import gcsfs
import fitz
import io
from vertexai.generative_models import GenerativeModel, Part
import logging
from dotenv import load_dotenv
import vertexai
from google.api_core.exceptions import ResourceExhausted
from jarvis.document_parsers.utils import count_tokens, merge_pages


load_dotenv()

logger = logging.getLogger(__name__)

vertexai.init(project=os.getenv("GOOGLE_PROJECT"), location="europe-west1")
model = GenerativeModel("gemini-2.0-flash-001")

bucket = asyncio.Queue(maxsize=10)


async def gemini_pdf_processor(src_path: str, target_path: str):
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
        response = await generate_async_with_backoff(contents=[pdf_file, prompt])
        # print(response.text)
        return response.text

    res = await asyncio.gather(*[handler(page_num) for page_num in range(len(doc))])
    num_pages = len(res)
    content = merge_pages(res)
    with fs.open(target_path, "w") as f:
        f.write(content)
    logger.info(f"written {target_path}")
    return num_pages, count_tokens(content)


async def generate_async_with_backoff(contents: List):
    try:
        await bucket.put(True)
        for i in itertools.count(start=1):
            try:
                res = await model.generate_content_async(contents=contents)
                return res
            except ResourceExhausted:
                logger.info(f"Resource exhausted - sleeping {i} sec")
                await asyncio.sleep(i)
    finally:
        await bucket.get()
