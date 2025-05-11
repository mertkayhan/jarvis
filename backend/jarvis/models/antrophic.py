import os
from langchain_anthropic import ChatAnthropic

SUPPORTED_MODELS = (
    {
        "claude-3-5-sonnet-20241022": {"temperature": 0},
        "claude-3-7-sonnet-20250219": {"temperature": 0},
    }
    if os.getenv("ANTHROPIC_API_KEY")
    else {}
)


def antrophic_model_resolver(model_name: str) -> ChatAnthropic:
    if model_name not in SUPPORTED_MODELS.keys():
        raise ValueError(
            f"unknown antrophic model  - supported models: {SUPPORTED_MODELS}"
        )
    return ChatAnthropic(
        **SUPPORTED_MODELS[model_name],
        model=model_name,  # type: ignore
        stream_usage=False,
    )
