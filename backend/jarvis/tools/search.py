from __future__ import annotations
import json
import os
from typing import Optional
from jarvis.context import Context, ToolContext
from langchain_core.documents import Document
from tavily import TavilyClient

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY")) if TAVILY_API_KEY else None


async def _top5_results_impl(query: str, ctx: Optional[Context] = None) -> str:
    assert client is not None, "tavily client is None!"
    resp = client.search(
        query=query,
        search_depth="advanced",
        topic="general",
        days=3,
        max_results=5,
        include_answer=True,
        include_raw_content=True,
    )
    results = resp.get("results", [])
    answer = resp.get("answer", "")
    follow_up_q = resp.get("follow_up_questions")

    if ctx:
        tool_ctx = ToolContext(
            tool_name="Google Search",
            tool_input=query,
            tool_output=sorted(
                [
                    Document(
                        metadata={
                            "title": result.get("title"),
                            "url": result.get("url"),
                            "score": result.get("score"),
                        },
                        # page_content=result.get("raw_content")
                        # or result.get("content", "Missing content"),
                        page_content=result.get("content", "Missing content"),
                    )
                    for result in results
                ],
                key=lambda x: x.metadata["score"],
                reverse=True,
            ),
        )
        await ctx.publish(tool_ctx)
    return json.dumps(
        {"results": results, "answer": answer, "follow_up_questions": follow_up_q}
    )


top5_results = _top5_results_impl if TAVILY_API_KEY else None
