import io
from dotenv import load_dotenv
import logging
import gcsfs
from llama_parse import LlamaParse, ResultType
from jarvis.blob_storage import resolve_storage
from jarvis.document_parsers.type import ParseResult, ProcessingResult
from jarvis.document_parsers.utils import count_tokens, merge_pages
import google.auth


load_dotenv()

logger = logging.getLogger(__name__)


def document_handler(
    src_path: str, target_path: str, use_premium_mode: bool = True
) -> ProcessingResult:
    _, project_id = google.auth.default()
    fs = gcsfs.GCSFileSystem(project=project_id, cache_timeout=0)  # type: ignore
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
    storage = resolve_storage()
    buf = io.BytesIO(content.encode("utf-8"))
    storage.write(buf, target_path)

    return ProcessingResult(
        document_name=src_path,
        failed=False,
        num_pages=len(docs),
        num_tokens=count_tokens(content),
    )
