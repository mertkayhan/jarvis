import gcsfs
from os import getenv
from jarvis.document_parsers.type import ProcessingResult
from jarvis.document_parsers.utils import count_tokens
from dotenv import load_dotenv

load_dotenv()


def process_txt(src_path: str, target_path: str) -> ProcessingResult:
    fs = gcsfs.GCSFileSystem(project=getenv("GOOGLE_PROJECT"), cache_timeout=0)

    with fs.open(src_path, "rb") as f:
        raw_content = f.read()
    with fs.open(target_path, "wb") as f:
        f.write(raw_content)

    try:
        content = raw_content.decode("utf-8")
    except UnicodeDecodeError:
        content = raw_content.decode("windows-1252")  # Handle non-UTF-8 files

    return ProcessingResult(
        document_name=src_path, num_tokens=count_tokens(content), failed=False
    )
