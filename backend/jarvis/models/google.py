import os
from langchain_google_vertexai import ChatVertexAI
import socket


def check_metadata_server_dns():
    metadata_server = "metadata.google.internal"
    try:
        socket.gethostbyname(metadata_server)
        return True
    except socket.gaierror:
        return False


SUPPORTED_MODELS = (
    {
        "gemini-1.5-pro-002": {"temperature": 0, "location": "europe-west3"},
        "gemini-1.5-flash-002": {"temperature": 0, "location": "europe-west3"},
        "gemini-2.0-flash-001": {"temperature": 0, "location": "europe-west1"},
        "gemini-2.0-flash-lite-001": {"temperature": 0, "location": "europe-west1"},
        "gemini-2.5-flash-lite": {
            "location": "global",
            "temperature": 1,
            "max_output_tokens": 65535,
        },
        "gemini-2.5-flash": {
            "location": "global",
            "temperature": 1,
            "max_output_tokens": 65535,
        },
        "gemini-2.5-pro": {
            "location": "global",
            "temperature": 1,
            "max_output_tokens": 65535,
        },
    }
    if os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or check_metadata_server_dns()
    else {}
)


def google_model_resolver(model_name: str):
    if model_name not in SUPPORTED_MODELS.keys():
        raise ValueError(
            f"unsupported google model - supported models: {SUPPORTED_MODELS}"
        )
    return ChatVertexAI(model_name=model_name, **SUPPORTED_MODELS[model_name])
