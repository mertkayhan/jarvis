import asyncio
import logging
import os
from pathlib import Path
import shutil
from typing import AsyncGenerator, TypedDict
import pandas as pd
from jarvis.blob_storage.storage import cleanup_blob_storage, must_list
from jarvis.document_parsers.gemini import GOOGLE_PROJECT, gemini_pdf_processor
from jarvis.document_parsers.type import ProcessingResult
from jarvis.graphrag.graphrag import index_documents
from jarvis.graphrag.preprocess import preprocess_docs
from jarvis.queries.query_handlers import insert_doc_into_pack

logger = logging.getLogger(__name__)

DOCUMENT_BUCKET = os.getenv("DOCUMENT_BUCKET")
assert DOCUMENT_BUCKET, "DOCUMENT_BUCKET is not set!"

GOOGLE_PROJECT = os.getenv("GOOGLE_PROJECT")
assert GOOGLE_PROJECT, "GOOGLE_PROJECT is not set!"


class StepResult(TypedDict):
    failed: bool
    message: dict[str, str]


async def execute_workflow(
    data,
) -> AsyncGenerator[StepResult, None]:
    steps = [
        (_parse_docs, "preprocessing"),
        (_preprocess_docs, "indexing"),
        (_index_docs, "done"),
    ]
    for impl, next_step_name in steps:
        res = await impl(data)
        if res == "fail":
            yield StepResult(failed=True, message={"stage": "fail"})
            raise StopIteration
        yield StepResult(failed=False, message={"stage": next_step_name})


async def _parse_docs(data):
    # TODO: consider incremental updates
    try:
        source_path = f"document_packs/{data['pack_id']}/raw"
        logger.info(f"parsing docs: {source_path}...")
        blobs = await must_list(
            GOOGLE_PROJECT, DOCUMENT_BUCKET, source_path  # type: ignore
        )
        doc_paths = [f"{DOCUMENT_BUCKET}/{blob}" for blob in blobs]
        logger.info(f"found docs: {doc_paths}")

        futures = []
        for source_path in doc_paths:
            target_path = source_path.replace("/raw/", "/parsed/")
            # gemini processor scales better
            futures.append(
                gemini_pdf_processor(
                    source_path,
                    target_path,
                )
            )
        res: list[ProcessingResult] = await asyncio.gather(*futures)
        for r in res:
            if r["failed"]:
                raise ValueError(f"parsing failed for {r['document_name']}")
        # TODO: let the user choose if the successful ones should be kept and if the workflow should be continued
        return "done"
    except Exception as err:
        logger.error(f"failed to parse docs: {err}", exc_info=True)
        # TODO:
        # await cleanup_blob_storage(GOOGLE_PROJECT, DOCUMENT_BUCKET, f"document_packs/{data['pack_id']}")  # type: ignore
        return "fail"


async def _preprocess_docs(data):
    # graph rag does not support markdown well at the moment, so we need to preprocess the data
    # TODO: consider incremental updates
    try:
        source_path = f"document_packs/{data['pack_id']}/parsed"
        logger.info(f"preprocessing docs: {source_path}...")
        blobs = await must_list(
            GOOGLE_PROJECT, DOCUMENT_BUCKET, source_path  # type: ignore
        )
        doc_paths = [f"{DOCUMENT_BUCKET}/{blob}" for blob in blobs]
        logger.info(f"found docs: {doc_paths}")

        futures = []
        for source_path in doc_paths:
            target_path = source_path.replace("/parsed/", "/preprocessed/")
            futures.append(preprocess_docs(source_path, target_path))

        await asyncio.gather(*futures)
        return "done"
    except Exception as err:
        logger.error(f"failed to preprocess docs: {err}", exc_info=True)
        # TODO:
        # await cleanup_blob_storage(GOOGLE_PROJECT, DOCUMENT_BUCKET, f"document_packs/{data['pack_id']}")  # type: ignore
        return "fail"


async def _index_docs(data):
    # TODO: consider incremental updates
    try:
        logger.info(f"indexing docs with pack id: {data['pack_id']}...")
        await index_documents(data["pack_id"], DOCUMENT_BUCKET)  # type: ignore
        logger.info("indexing done")
        logger.info("inserting docs into db")
        root = Path(f"/tmp/jarvis/{data['pack_id']}")
        documents_pq = root / "output/documents.parquet"
        documents = pd.read_parquet(documents_pq, columns=["id", "title"]).to_dict(
            orient="records"
        )
        for doc in documents:
            await insert_doc_into_pack(doc["title"], data["pack_id"], doc["id"])
        logger.info("done inserting docs")
        return "done"
    except Exception as err:
        logger.error(f"failed to index docs: {err}", exc_info=True)
        # TODO:
        # await cleanup_blob_storage(GOOGLE_PROJECT, DOCUMENT_BUCKET, f"document_packs/{data['pack_id']}")  # type: ignore
        # shutil.rmtree(f"/tmp/jarvis/{data['pack_id']}", ignore_errors=True)
        # TODO: clean up db
        return "fail"
