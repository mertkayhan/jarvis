import asyncio
import os
from typing import Any, Dict
from graphrag.api import (
    build_index,
    global_search as graphrag_global_search,
    local_search as graphrag_local_search,
)
from graphrag.config import create_graphrag_config
import yaml
import logging
import gcsfs
from graphrag.prompts.index.community_report import (
    COMMUNITY_REPORT_PROMPT,
)
from graphrag.prompts.index.community_report_text_units import (
    COMMUNITY_REPORT_TEXT_PROMPT,
)
from graphrag.prompts.index.extract_claims import EXTRACT_CLAIMS_PROMPT
from graphrag.prompts.index.extract_graph import GRAPH_EXTRACTION_PROMPT
from graphrag.prompts.index.summarize_descriptions import SUMMARIZE_PROMPT
from graphrag.prompts.query.basic_search_system_prompt import BASIC_SEARCH_SYSTEM_PROMPT
from graphrag.prompts.query.drift_search_system_prompt import (
    DRIFT_LOCAL_SYSTEM_PROMPT,
    DRIFT_REDUCE_PROMPT,
)
from graphrag.prompts.query.global_search_knowledge_system_prompt import (
    GENERAL_KNOWLEDGE_INSTRUCTION,
)
from graphrag.prompts.query.global_search_map_system_prompt import MAP_SYSTEM_PROMPT
from graphrag.prompts.query.global_search_reduce_system_prompt import (
    REDUCE_SYSTEM_PROMPT,
)
from graphrag.prompts.query.local_search_system_prompt import LOCAL_SEARCH_SYSTEM_PROMPT
from graphrag.prompts.query.question_gen_system_prompt import QUESTION_SYSTEM_PROMPT
from pathlib import Path
import pandas as pd
from graphrag.cli.query import _resolve_output_files
from glob import glob
from jarvis.blob_storage.storage import must_list
from dotenv import load_dotenv

load_dotenv()


logger = logging.getLogger(__name__)

PROMPTS = {
    "extract_graph": GRAPH_EXTRACTION_PROMPT,
    "summarize_descriptions": SUMMARIZE_PROMPT,
    "extract_claims": EXTRACT_CLAIMS_PROMPT,
    "community_report_graph": COMMUNITY_REPORT_PROMPT,
    "community_report_text": COMMUNITY_REPORT_TEXT_PROMPT,
    "drift_search_system_prompt": DRIFT_LOCAL_SYSTEM_PROMPT,
    "drift_reduce_prompt": DRIFT_REDUCE_PROMPT,
    "global_search_map_system_prompt": MAP_SYSTEM_PROMPT,
    "global_search_reduce_system_prompt": REDUCE_SYSTEM_PROMPT,
    "global_search_knowledge_system_prompt": GENERAL_KNOWLEDGE_INSTRUCTION,
    "local_search_system_prompt": LOCAL_SEARCH_SYSTEM_PROMPT,
    "basic_search_system_prompt": BASIC_SEARCH_SYSTEM_PROMPT,
    "question_gen_system_prompt": QUESTION_SYSTEM_PROMPT,
}


def init(pack_id: str, cfg_dict: Dict[str, Any]):
    root = Path(f"/tmp/jarvis/{pack_id}")
    if not root.exists():
        root.mkdir(parents=True, exist_ok=True)

    input_path = root / "input"
    if not input_path.exists():
        input_path.mkdir(parents=True, exist_ok=True)

    settings_yaml = root / "settings.yaml"
    if not settings_yaml.exists():
        with settings_yaml.open("w") as file:
            yaml.safe_dump(cfg_dict, file)

    dotenv = root / ".env"
    if not dotenv.exists():
        with dotenv.open("wb") as file:
            file.write(f"GRAPHRAG_API_KEY='{os.getenv("OPENAI_API_KEY")}'".encode())

    prompts_dir = root / "prompts"
    if not prompts_dir.exists():
        prompts_dir.mkdir(parents=True, exist_ok=True)

    for name, content in PROMPTS.items():
        prompt_file = prompts_dir / f"{name}.txt"
        if not prompt_file.exists():
            with prompt_file.open("wb") as file:
                file.write(content.encode(encoding="utf-8", errors="strict"))


async def sync_with_gcs(pack_id: str, bucket: str):
    root = Path(f"/tmp/jarvis/{pack_id}")
    source_path = f"document_packs/{pack_id}/preprocessed"
    fs = gcsfs.GCSFileSystem(project=os.getenv("GOOGLE_PROJECT"))
    blobs = await must_list(os.getenv("GOOGLE_PROJECT"), bucket, source_path)
    doc_paths = [f"{bucket}/{blob}" for blob in blobs]
    logger.info(f"found docs: {doc_paths}")
    logger.info("copying from gcs to local...")
    for doc in doc_paths:
        with fs.open(doc, "rb") as f:
            tmp = f.read()
        fname = doc.replace(f"{source_path}/", "").replace(f"{bucket}/", "")
        # extension is explicitly checked
        with open(f"{root}/input/{fname}.txt", "wb") as f:
            f.write(tmp)


async def index_documents(pack_id: str, bucket: str):
    root = Path(f"/tmp/jarvis/{pack_id}")
    with open("jarvis/graphrag/cfg.yaml", "rb") as f:
        cfg_dict = yaml.safe_load(f)
        cfg_dict["models"]["default_chat_model"]["api_key"] = os.getenv(
            "OPENAI_API_KEY"
        )
        cfg_dict["models"]["default_embedding_model"]["api_key"] = os.getenv(
            "OPENAI_API_KEY"
        )
    if not (root / "settings.yaml").exists():
        logger.info(f"init index {pack_id}")
        init(pack_id, cfg_dict)
        logger.info("done")
    else:
        logger.info(f"index {pack_id} already exists")
    logger.info("sync files")
    await sync_with_gcs(pack_id, bucket)
    logger.info("done")
    logger.info("generating graphrag config")
    cfg = create_graphrag_config.create_graphrag_config(values=cfg_dict, root_dir=root)
    logger.info("done")
    logger.info("start building index")
    await build_index(cfg)
    logger.info("done")
    fs = gcsfs.GCSFileSystem(project=os.getenv("GOOGLE_PROJECT"), cache_timeout=0)
    for p in crawl(root):
        p_stream = p.read_bytes()
        name = p.as_posix().replace(root.as_posix(), "").strip("/")
        target = f"{bucket}/document_packs/{pack_id}/indices/{name}"
        with fs.open(target, "wb") as f:
            f.write(p_stream)


def crawl(root: Path):
    for element in glob(f"{root.as_posix()}/*"):
        element_path = Path(element)
        if not element_path.is_dir():
            yield element_path
        yield from crawl(element_path)


async def query_documents(
    pack_id: str, query: str, mode: str = "local"
) -> Dict[str, Any]:
    root = f"/tmp/jarvis/{pack_id}"
    if mode == "local":
        return {"local": await local_search(root, query)}
    elif mode == "global":
        return {"global": await global_search(root, query)}
    else:
        res = await asyncio.gather(
            *[local_search(root, query), global_search(root, query)]
        )
        return {"local": res[0], "global": res[1]}


async def global_search(root: str, query: str) -> Dict[str, Any]:
    root = Path(root)
    settings_yaml = root / "settings.yaml"
    with open(settings_yaml, "rb") as f:
        cfg_dict = yaml.safe_load(f)
    config = create_graphrag_config.create_graphrag_config(
        values=cfg_dict, root_dir=root
    )
    dataframe_dict = _resolve_output_files(
        config=config,
        output_list=[
            "entities",
            "communities",
            "community_reports",
        ],
        optional_list=[],
    )
    final_entities: pd.DataFrame = dataframe_dict["entities"]
    final_communities: pd.DataFrame = dataframe_dict["communities"]
    final_community_reports: pd.DataFrame = dataframe_dict["community_reports"]
    community_level = 2
    dynamic_community_selection = False
    response_type = "Multiple Paragraphs"
    full_response, context_data = await graphrag_global_search(
        config=config,
        entities=final_entities,
        communities=final_communities,
        community_reports=final_community_reports,
        community_level=community_level,
        dynamic_community_selection=dynamic_community_selection,
        response_type=response_type,
        query=query,
        callbacks=[],
    )
    return {
        "response": full_response,
        "context": {
            key: value.to_dict(orient="records") for key, value in context_data.items()
        },
    }


async def local_search(root: str, query: str) -> Dict[str, Any]:
    root = Path(root)
    settings_yaml = root / "settings.yaml"
    with open(settings_yaml, "rb") as f:
        cfg_dict = yaml.safe_load(f)
    config = create_graphrag_config.create_graphrag_config(
        values=cfg_dict, root_dir=root
    )
    dataframe_dict = _resolve_output_files(
        config=config,
        output_list=[
            "communities",
            "community_reports",
            "text_units",
            "relationships",
            "entities",
        ],
        optional_list=[
            "covariates",
        ],
    )
    final_communities: pd.DataFrame = dataframe_dict["communities"]
    final_community_reports: pd.DataFrame = dataframe_dict["community_reports"]
    final_text_units: pd.DataFrame = dataframe_dict["text_units"]
    final_relationships: pd.DataFrame = dataframe_dict["relationships"]
    final_entities: pd.DataFrame = dataframe_dict["entities"]
    final_covariates: pd.DataFrame | None = dataframe_dict["covariates"]
    community_level = 2
    response_type = "Multiple Paragraphs"
    full_response, context_data = await graphrag_local_search(
        config=config,
        entities=final_entities,
        communities=final_communities,
        community_reports=final_community_reports,
        text_units=final_text_units,
        relationships=final_relationships,
        covariates=final_covariates,
        community_level=community_level,
        response_type=response_type,
        query=query,
        callbacks=[],
    )
    source_snippets = context_data["sources"]
    source_snippets["human_readable_id"] = (
        source_snippets["id"].apply(lambda x: int(x)) + 1
    )
    documents_pq = root / "output/documents.parquet"
    documents = pd.read_parquet(documents_pq, columns=["id", "title"]).rename(
        columns={"id": "document_id"}
    )
    documents["document_id"] = documents["document_id"].astype(str)
    documents = documents.set_index("document_id")
    final_text_units = final_text_units.explode(["document_ids"]).rename(
        columns={"document_ids": "document_id"}
    )
    final_text_units["document_id"] = final_text_units["document_id"].astype(str)
    source_enriched = pd.merge(
        final_text_units,
        context_data["sources"],
        on="human_readable_id",
        how="inner",
        suffixes=("_text_unit", "_sources"),
    )[["id_sources", "text_sources", "document_id"]]
    # print(context_data["sources"])
    # print(source_enriched)
    source_enriched["document_id"] = source_enriched["document_id"].astype(str)
    source_enriched = pd.merge(source_enriched, documents, on="document_id").rename(
        columns={"id_sources": "id", "text_sources": "text", "title": "document_title"}
    )
    # print(source_enriched)

    return {
        "response": full_response,
        "context": {
            key: value.to_dict(orient="records") for key, value in context_data.items()
        },
        "context_enriched": {"sources": source_enriched.to_dict(orient="records")},
    }
