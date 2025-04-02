from __future__ import annotations

from dotenv import load_dotenv
import logging
from typing import Any, Dict, List
from jarvis.context import Context
from langchain_core.tools import StructuredTool
from jarvis.tools.document_pack import document_pack_retriever
from jarvis.tools.question_pack import question_pack_retriever
from jarvis.tools.search import top5_results

load_dotenv()
logger = logging.getLogger(__name__)


def bootstrap_tools(ctx: Context, tool_names: List[str]) -> List[StructuredTool]:
    async def top5_results_partial(query: str) -> str:
        return await top5_results(query=query, ctx=ctx)

    tool_bundles = {
        "Google Search": [
            {
                "coroutine": top5_results_partial,
                "description": "Search Google for recent results.",
                "name": "Google-Search",
            }
        ],
    }

    if ctx.question_pack:

        tool_name = "Question-Pack-Retriever"
        tool_index_name = "Question Pack Retriever"

        async def question_pack_retriever_partial(query: str) -> Dict[str, Any]:
            return await question_pack_retriever(query, ctx.question_pack["id"], ctx)  # type: ignore

        question_pack_retriever_partial.__doc__ = f"""
        Retrieves the most relevant question-answer pairs from a specified question pack 
        using a hybrid search approach (semantic similarity + keyword matching).

        This tool is optimized for:
            - Answering frequently asked questions.
            - Providing contextually relevant responses.
            - Surfacing related information from prior interactions.

        ## How It Works:
        - Takes a user **query** as input.
        - Searches the question pack for the **most relevant Q&A pairs**.
        - Returns the most relevant results, which can be used for **context augmentation, reasoning, or direct responses**.

        **Current Question Pack:** "{ctx.question_pack["description"]}"

        ### Parameters:
        - `query` (str): The input query used to find relevant question-answer pairs.

        ### Returns:
        - `Dict[str, Any]`: The best-matching question-answer pairs retrieved from the question pack.
        """

        tool_bundles[tool_index_name] = [
            {
                "coroutine": question_pack_retriever_partial,
                "description": question_pack_retriever_partial.__doc__,
                "name": tool_name,
            }
        ]
        tool_names.append(tool_index_name)

    if ctx.document_pack:

        tool_name = "Document-Pack-Retriever"
        tool_index_name = "Document Pack Retriever"

        async def document_pack_retriever_partial(query: str) -> Dict[str, Any]:
            return await document_pack_retriever(query, ctx.document_pack["id"], ctx)

        document_pack_retriever_partial.__doc__ = f"""
        Retrieves the most relevant document passages from a specified document pack  
        using **Microsoft’s Graph RAG** approach (multi-hop graph-based retrieval with semantic reranking).

        This tool is optimized for:
        - Answering complex or multi-faceted queries.
        - Providing **deeply contextual responses** across interconnected documents.
        - Discovering **related insights** through graph-based reasoning.

        ## How It Works:
        - Takes a user **query** as input.
        - Performs a **multi-hop graph traversal** over indexed document nodes to identify relevant content.
        - Uses **semantic reranking** to return the **most contextually relevant passages**.
        - Returns results that can be used for **context augmentation, reasoning, or direct responses**.

        **Current Document Pack:** `{ctx.document_pack['description']}`

        ### Parameters:
        - `query` (`str`): The input query used to retrieve relevant document content.

        ### Returns:
        - `Dict[str, Any]`: The most relevant passages and associated metadata from the document pack.
        """

        tool_bundles[tool_index_name] = [
            {
                "coroutine": document_pack_retriever_partial,
                "description": document_pack_retriever_partial.__doc__,
                "name": tool_name,
            }
        ]
        tool_names.append(tool_index_name)

    res = [
        StructuredTool.from_function(**bundle)
        for name in tool_names
        for bundle in tool_bundles.get(name, [])
        if bundle
    ]
    logger.info(f"tool selection: {tool_names}")
    return res
