import io
from os import getenv
from jarvis.blob_storage import resolve_storage
from jarvis.document_parsers.type import ProcessingResult
from jarvis.document_parsers.utils import count_tokens
from dotenv import load_dotenv

load_dotenv()


def process_txt(src_path: str, target_path: str) -> ProcessingResult:
    storage = resolve_storage()
    raw_content = storage.read(src_path)
    buf = io.BytesIO(raw_content)
    storage.write(buf, target_path)

    try:
        content = raw_content.decode("utf-8")
    except UnicodeDecodeError:
        content = raw_content.decode("windows-1252")  # Handle non-UTF-8 files

    return ProcessingResult(
        document_name=src_path,
        num_tokens=count_tokens(content),
        failed=False,
        num_pages=None,
    )
