import asyncio
from typing import List
from jarvis.document_parsers.csv import process_csv
from jarvis.document_parsers.gemini import gemini_pdf_processor
from jarvis.document_parsers.llamaparse import document_handler
from jarvis.document_parsers.txt import process_txt
from jarvis.document_parsers.type import Parser, ProcessingResult


def resolve_parser(fname: str) -> List[Parser]:
    if (
        not fname.lower().endswith(".csv")
        and not fname.lower().endswith(".txt")
        and not fname.lower().endswith(".pdf")
        and not fname.lower().endswith(".xlsx")
    ):
        raise TypeError("unknown document type")

    if fname.lower().endswith(".txt"):
        return [Parser(kind="accurate", impl=process_txt_wrapper)]

    elif fname.lower().endswith(".csv"):
        return [Parser(kind="accurate", impl=process_csv_wrapper)]

    elif fname.lower().endswith(".pdf"):
        return [
            Parser(kind="fast", impl=gemini_pdf_processor),
            Parser(kind="accurate", impl=document_handler_wrapper),
        ]
    else:  # .xlsx
        return [Parser(kind="accurate", impl=document_handler_wrapper)]


async def process_txt_wrapper(**kwargs) -> ProcessingResult:
    return await asyncio.to_thread(process_txt, **kwargs)


async def process_csv_wrapper(**kwargs) -> ProcessingResult:
    return await asyncio.to_thread(process_csv, **kwargs)


async def document_handler_wrapper(**kwargs) -> ProcessingResult:
    return await asyncio.to_thread(document_handler, **kwargs)
