from typing import List
import tiktoken


def count_tokens(content: str) -> int:
    encoding_name = "o200k_base"
    encoding = tiktoken.get_encoding(encoding_name)
    content_encoded = encoding.encode(content)
    return len(content_encoded)


def merge_pages(pages: List[str]) -> str:
    return "\n\n".join(page + f"\n\nPage number: {i+1}" for i, page in enumerate(pages))
