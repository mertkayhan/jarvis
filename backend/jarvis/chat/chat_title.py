from pydantic import BaseModel, Field
from jarvis.messages.type import Message
from models.models import Model
from typing import Sequence
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate


class ChatTitle(BaseModel):
    title: str = Field(
        description="Generated chat title for a given conversation history"
    )


async def create_chat_title(llm: Model, messages: Sequence[Message]) -> str:
    system = """
    You are an AI assistant that generates concise and descriptive chat titles based on the first two messages of a conversation.  
    - The title should capture the main topic or intent of the conversation.  
    - Keep it brief, ideally under 8 words.  
    - Use natural language, avoiding generic or vague phrases.  
    - Do not include "User" or "AI" in the title.  
    - If the topic is unclear, prioritize the most informative keyword or phrase.  
    """
    messages_with_system_prompt = [("system", system)] + [
        HumanMessage(content=m) if i % 2 == 0 else AIMessage(content=m)
        for i, m in enumerate(messages)
    ]
    prompt = ChatPromptTemplate.from_messages(messages_with_system_prompt)

    structured_llm = llm["model_impl"].with_structured_output(ChatTitle)
    structured_llm = prompt | structured_llm

    res = await structured_llm.ainvoke({})
    return res.title
