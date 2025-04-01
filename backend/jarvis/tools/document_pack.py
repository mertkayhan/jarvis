import json
from typing import Any, Dict, Optional
from jarvis.context.context import Context, ToolContext
from jarvis.graphrag.graphrag import query_documents
from langchain_core.documents import Document


async def document_pack_retriever(
    query: str,
    pack_id: str,
    ctx: Optional[Context] = None,
) -> Dict[str, Any]:
    res = await query_documents(pack_id, query, mode="mixed")

    if ctx:
        docs = []
        local_sources = res["local"]["context_enriched"]["sources"]
        for src in local_sources:
            docs.append(
                Document(
                    page_content=src["text"],
                    metadata={
                        "id": src["id"],
                        "document_id": src["document_id"],
                        "document_name": src["document_title"],
                        "type": "Snippet",
                    },
                )
            )
        global_reports = res["global"]["context"]["reports"]
        for r in global_reports:
            docs.append(
                Document(
                    page_content=r["content"],
                    metadata={
                        "id": r["id"],
                        "title": r["title"],
                        "type": "Report",
                    },
                )
            )
        tool_ctx = ToolContext(
            tool_name="document_pack_retriever",
            tool_input=json.dumps({"query": query, "pack_id": pack_id}),
            tool_output=docs,
        )
        await ctx.publish(tool_ctx)

    return {
        "content": [
            {"type": "text", "text": res["local"]["response"]},
            {"type": "text", "text": res["global"]["response"]},
        ]
    }
