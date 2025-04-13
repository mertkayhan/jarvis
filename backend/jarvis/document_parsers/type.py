from typing import Callable, Coroutine, Literal, Optional, TypedDict


class ProcessingResult(TypedDict):
    document_name: str
    num_pages: Optional[int]
    num_tokens: Optional[int]
    failed: bool


class Parser:
    def __init__(
        self,
        kind: Literal["accurate", "fast"],
        impl: Callable[[str, str], Coroutine[None, None, ProcessingResult]],
    ):
        self.kind = kind
        self.impl = impl

    async def __call__(self, src_path: str, target_path: str) -> ProcessingResult:
        return await self.impl(src_path, target_path)


class ParseResult(TypedDict):
    document_name: str
    page_number: int
    content: Optional[str]
    failed: bool
