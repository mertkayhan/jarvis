import json
from typing import Any, Dict, Optional
from jarvis.context import Context
from langchain_openai import OpenAIEmbeddings
from langchain_core.documents import Document
from jarvis.context.context import ToolContext
import re
from markdownify import markdownify as md

from jarvis.question_pack.retriever import retrieve


embedding = OpenAIEmbeddings(model="text-embedding-3-small")


async def question_pack_retriever(
    query: str,
    pack_id: str,
    ctx: Optional[Context] = None,
) -> Dict[str, Any]:
    query_embedding = (
        "[" + ",".join(map(lambda x: str(x), await embedding.aembed_query(query))) + "]"
    )
    res = await retrieve(pack_id, query_embedding, query)
    image_pattern = r'<img\s+[^>]*src=["\']([^"\']+)["\'][^>]*>'
    resp = {"content": []}
    docs = []

    for r in res:
        answer_text = re.sub(image_pattern, "", r["answer"])
        answer_imgs = re.findall(image_pattern, r["answer"])

        docs.append(
            Document(
                page_content=f"## {r['question']}\n\n{md(r['answer'])}",
                metadata={
                    "similarity": r["similarity"],
                    "id": str(r["id"]),
                    "tags": r["tags"],
                    **{
                        key: value
                        for additional_info in r.get("additional_info") or [{}]
                        for key, value in additional_info.items()
                    },
                },
            )
        )

        resp["content"].extend(
            [
                {"type": "text", "text": answer_text},
                *[
                    {
                        "type": "image_url",
                        "image_url": {"url": img},
                    }
                    for img in answer_imgs
                ],
            ]
        )

    if ctx:
        tool_ctx = ToolContext(
            tool_name="question_pack_retriever",
            tool_input=json.dumps({"query": query, "pack_id": pack_id}),
            tool_output=docs,
        )
        await ctx.publish(tool_ctx)

    return resp
