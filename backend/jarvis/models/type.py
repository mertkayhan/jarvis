from typing import TypedDict
from langchain_core.language_models import BaseChatModel


class Model(TypedDict):
    model_impl: BaseChatModel
    model_name: str
