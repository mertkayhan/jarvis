from dotenv import load_dotenv
import logging
import gcsfs
from llama_parse import LlamaParse, ResultType
from os import getenv
from jarvis.document_parsers.type import ParseResult, ProcessingResult
from jarvis.document_parsers.utils import count_tokens, merge_pages


load_dotenv()

logger = logging.getLogger(__name__)


GOOGLE_PROJECT = getenv("GOOGLE_PROJECT")
assert GOOGLE_PROJECT, "GOOGLE_PROJECT is not set!"


def document_handler(
    src_path: str, target_path: str, use_premium_mode: bool = True
) -> ProcessingResult:
    fs = gcsfs.GCSFileSystem(project=GOOGLE_PROJECT, cache_timeout=0)  # type: ignore
    logger.info("triggering llamaparse...")
    docs = LlamaParse(
        skip_diagonal_text=True,
        result_type=ResultType.MD,
        premium_mode=use_premium_mode,
        do_not_cache=True,  # data should not be stored at their servers
    ).load_data(file_path=src_path, fs=fs)
    logger.info("llama parse done")
    logger.info(f"number of docs: {len(docs)}")
    if len(docs) < 0:
        logger.error("Llamaparse internal error", exc_info=True)
        return ProcessingResult(
            failed=True, document_name=src_path, num_pages=None, num_tokens=None
        )
    content = merge_pages(
        [
            ParseResult(
                document_name=src_path,
                content=doc.text,
                failed=False,
                page_number=i + 1,
            )
            for i, doc in enumerate(docs)
        ]
    )
    with fs.open(target_path, "w") as f:
        f.write(content)
    return ProcessingResult(
        document_name=src_path,
        failed=False,
        num_pages=len(docs),
        num_tokens=count_tokens(content),
    )
