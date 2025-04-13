from typing import List
import tiktoken

from jarvis.document_parsers.gemini import ParseResult


def count_tokens(content: str) -> int:
    encoding_name = "o200k_base"
    encoding = tiktoken.get_encoding(encoding_name)
    content_encoded = encoding.encode(content)
    return len(content_encoded)


def merge_pages(res: List[ParseResult]) -> str:
    return "\n\n".join(
        r["content"] + f"\n\nPage number: {i+1}" for i, r in enumerate(res)  # type: ignore
    )
