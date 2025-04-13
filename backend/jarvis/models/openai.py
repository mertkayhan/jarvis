import os
from langchain_openai import ChatOpenAI

SUPPORTED_MODELS = (
    {
        "gpt-4o": {"temperature": 0},
        "gpt-4o-mini": {"temperature": 0},
        "o1": {"reasoning_effort": "medium"},
        # TODO:
        # o1-mini does not support developer message yet so this will cause an error
        # https://community.openai.com/t/developer-role-not-accepted-for-o1-o1-mini-o3-mini/1110750/6
        # "o1-mini": {},
        "o3-mini": {"reasoning_effort": "medium"},
        "gpt-4.5-preview": {"temperature": 0},
    }
    if os.getenv("OPENAI_API_KEY")
    else {}
)


def openai_model_resolver(model_name: str) -> ChatOpenAI:
    if model_name not in SUPPORTED_MODELS.keys():
        raise ValueError(f"unknown openai model - supported models: {SUPPORTED_MODELS}")
    return ChatOpenAI(
        model=model_name,
        **SUPPORTED_MODELS[model_name],  # type: ignore
    )
