from typing import Callable, Literal, Optional, TypedDict


class ProcessingResult(TypedDict):
    document_name: str
    num_pages: Optional[int]
    num_tokens: Optional[int]
    failed: bool


class Parser:
    def __init__(
        self,
        kind: Literal["accurate", "fast"],
        impl: Callable[[str, str], ProcessingResult],
    ):
        self.kind = kind
        self.impl = impl

    async def __call__(self, src_path: str, target_path: str) -> ProcessingResult:
        return await self.impl(src_path=src_path, target_path=target_path)
