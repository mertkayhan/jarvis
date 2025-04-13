import gcsfs
from os import getenv
from jarvis.document_parsers.type import ProcessingResult
from jarvis.document_parsers.utils import count_tokens
from dotenv import load_dotenv

load_dotenv()

GOOGLE_PROJECT = getenv("GOOGLE_PROJECT")
assert GOOGLE_PROJECT, "GOOGLE_PROJECT is not set!"


def process_txt(src_path: str, target_path: str) -> ProcessingResult:
    fs = gcsfs.GCSFileSystem(project=GOOGLE_PROJECT, cache_timeout=0)  # type: ignore

    with fs.open(src_path, "rb") as f:
        raw_content: bytes = f.read()  # type: ignore
    with fs.open(target_path, "wb") as f:
        f.write(raw_content)  # type: ignore

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
