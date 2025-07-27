from typing import TypedDict, Union
from langchain_anthropic import ChatAnthropic
from langchain_google_vertexai import ChatVertexAI
from langchain_openai import ChatOpenAI


class Model(TypedDict):
    model_impl: Union[ChatOpenAI, ChatVertexAI, ChatAnthropic]
    model_name: str
