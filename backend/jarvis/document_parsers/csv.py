import pandas as pd

from jarvis.document_parsers.type import ProcessingResult


def process_csv(src_path: str, target_path: str) -> ProcessingResult:
    df = pd.read_csv(src_path)
    df.to_markdown(target_path)
    return ProcessingResult(
        document_name=src_path, failed=False, num_pages=None, num_tokens=None
    )
