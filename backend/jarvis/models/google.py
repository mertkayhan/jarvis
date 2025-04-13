import os
from langchain_google_vertexai import ChatVertexAI

SUPPORTED_MODELS = (
    {
        "gemini-1.5-pro-002": {"temperature": 0, "location": "europe-west3"},
        "gemini-1.5-flash-002": {"temperature": 0, "location": "europe-west3"},
        "gemini-2.0-flash-001": {"temperature": 0, "location": "europe-west1"},
        "gemini-2.0-flash-lite-001": {"temperature": 0, "location": "europe-west1"},
        "gemini-2.5-pro-preview-03-25": {"temperature": 0, "location": "us-central1"},
    }
    if os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    else {}
)


def google_model_resolver(model_name: str):
    if model_name not in SUPPORTED_MODELS.keys():
        raise ValueError(
            f"unsupported google model - supported models: {SUPPORTED_MODELS}"
        )
    return ChatVertexAI(model_name=model_name, **SUPPORTED_MODELS[model_name])
