import asyncio
import datetime
from typing import Any, Optional, cast
from uuid import UUID
from psycopg import AsyncConnection
from pydantic import BaseModel
from psycopg.rows import dict_row
from jarvis.tools import ALL_AVAILABLE_TOOLS


class Personality(BaseModel):
    name: str
    description: str
    owner: str = ""
    id: Optional[UUID] = None
    instructions: str = ""
    isDefault: bool = False
    tools: list[str] = []
    doc_ids: list[str] = []

    def get(self, key):
        return self.model_dump().get(key)


DEFAULT_PERSONALITY = Personality(
    name="default",
    tools=ALL_AVAILABLE_TOOLS,
    description="This is the default system prompt for Jarvis.",
    instructions=f"""
The assistant is Jarvis.

The current date is {datetime.datetime.now(datetime.timezone.utc).isoformat()}.

## Thought Process & Reasoning
- When faced with a math, logic, or complex reasoning problem, Jarvis systematically thinks through the problem step by step before delivering a final answer.
- Jarvis provides thorough responses to complex or open-ended questions and concise responses to simpler tasks.

## Information Extraction & Prioritization
- **Primary Source**: When a question pack is available, prioritize extracting relevant information from it before considering other sources or asking the user for additional details.
- **Fallback Strategy**: If the question pack does not contain the necessary information, then proceed to ask the user for more specific details or use other available tools, such as web search.
- **Clarification**: Only ask the user for additional information if the question pack and other tools do not provide a satisfactory answer.

## Conversational Approach
- Jarvis engages in **authentic, natural conversations**, responding to the user's input, asking relevant follow-up questions only when necessary.
- Jarvis avoids excessive questioning and ensures a balanced dialogue.
- Jarvis adapts its tone and style to the user's preference and context.

## Capabilities & Tools
- Jarvis assists with **analysis, question answering, coding, document understanding, creative writing, teaching, and general discussions**.
- Jarvis retrieves up-to-date information from the web using Google Search when necessary.
- If analyzing a document it does not have access to, Jarvis prompts the user to upload it to the Document Repository. The user must attach the processed document for analysis.

## Formatting & Usability
- Jarvis follows best practices for **Markdown formatting** to enhance clarity and readability.
- Jarvis continuously improves based on user feedback.

## Language Adaptability
- Jarvis follows these instructions in all languages and responds in the language the user uses or requests.
""",
)


class UserPersonalities(BaseModel):
    personalities: list[Personality]
    default_personality: Personality


async def get_user_personalities(
    user_id: str, conn: AsyncConnection
) -> UserPersonalities:
    # TODO: This needs to be a join!
    list_query = """
        SELECT 
            id,
            description,
            name,
            owner,
            tools,
            doc_ids,
            instructions
        FROM common.personalities
        WHERE deleted = false AND owner IN ('system', %(user_id)s)
        ORDER BY updated_at DESC
    """
    default_query = """
        SELECT 
            user_id,
            personality_id
        FROM common.default_personalities 
        WHERE user_id = %(user_id)s
    """

    async def _get_default_personality(conn: AsyncConnection) -> dict[str, Any]:
        async with conn.cursor(row_factory=dict_row) as cur:
            resp = await cur.execute(default_query, {"user_id": user_id})
            res = await resp.fetchall()
            return res[0] if res else {"personality_id": None}

    async def _get_personalities(conn: AsyncConnection) -> list[dict[str, Any]]:
        async with conn.cursor(row_factory=dict_row) as cur:
            resp = await cur.execute(list_query, {"user_id": user_id})
            res = await resp.fetchall()
            return res

    [personalities, default_personality] = await asyncio.gather(
        *[_get_personalities(conn), _get_default_personality(conn)]
    )
    default_personality = next(
        filter(
            lambda x: x["id"]
            == cast(dict[str, Any], default_personality).get("personality_id"),
            personalities,
        ),
        None,
    )
    default_personality = default_personality or DEFAULT_PERSONALITY
    return UserPersonalities(
        personalities=[
            Personality(
                id=p["id"],  # type: ignore
                description=p["description"],  # type: ignore
                name=p["name"],  # type: ignore
                owner=p["owner"],  # type: ignore
                isDefault=(default_personality.get("id") == p["id"]),  # type: ignore
                tools=p["tools"],
                doc_ids=p["doc_ids"],
                instructions=p["instructions"],
            )
            for p in personalities
        ],
        default_personality=default_personality,
    )
