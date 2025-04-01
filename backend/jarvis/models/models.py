from typing import Optional, TypedDict
from langchain_google_vertexai import ChatVertexAI
from langchain_core.language_models import BaseChatModel
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
import logging

logger = logging.getLogger(__name__)


class Model(TypedDict):
    model_impl: BaseChatModel
    model_name: str


def model_factory(model_selection: str, token_count: Optional[int]) -> Model:
    token_count = token_count or 0
    # this used to be under automatic but to avoid breaking user conversations moved here
    if token_count > 100_000:
        logger.info(
            f"using claude-3-5-sonnet-20241022 due to semi large document - tokens: {token_count}"
        )
        logger.info("using ")
        return Model(
            model_impl=ChatAnthropic(
                temperature=0,
                model="claude-3-5-sonnet-20241022",
                max_tokens=8192,
            ),
            model_name="claude-3-5-sonnet-20241022",
        )
    elif token_count > 200_000:
        logger.info(
            f"using gemini-1.5-pro-002 due to large document - tokens: {token_count}"
        )
        return Model(
            model_impl=ChatVertexAI(
                model="gemini-1.5-pro-002",
                temperature=0,
                location="europe-west3",
                max_tokens=8192,
            ),
            model_name="gemini-1.5-pro-002",
        )
    if model_selection == "claude-3-5-sonnet-20241022":
        logger.info("using claude-3-5-sonnet-20241022")
        return Model(
            model_impl=ChatAnthropic(
                temperature=0,
                model="claude-3-5-sonnet-20241022",
                max_tokens=8192,
            ),
            model_name="claude-3-5-sonnet-20241022",
        )
    if model_selection == "gpt-4o":
        logger.info("using gpt-4o")
        return Model(
            model_impl=ChatOpenAI(
                temperature=0,
                model_name="gpt-4o",
                max_tokens=8192,
            ),
            model_name="gpt-4o",
        )
    if model_selection == "gpt-4o-mini":
        logger.info("using gpt-4o-mini")
        return Model(
            model_impl=ChatOpenAI(
                temperature=0,
                model_name="gpt-4o-mini",
                max_tokens=8192,
            ),
            model_name="gpt-4o-mini",
        )
    if model_selection == "gemini-1.5-flash-002":
        logger.info("using gemini-1.5-flash-002")
        return Model(
            model_impl=ChatVertexAI(
                model="gemini-1.5-flash-002",
                temperature=0,
                location="europe-west3",
                max_tokens=8192,
            ),
            model_name="gemini-1.5-flash-002",
        )
    if model_selection == "gemini-1.5-pro-002":
        logger.info("using gemini-1.5-pro-002")
        return Model(
            model_impl=ChatVertexAI(
                model="gemini-1.5-pro-002",
                temperature=0,
                location="europe-west3",
                max_tokens=8192,
            ),
            model_name="gemini-1.5-pro-002",
        )
    if model_selection == "automatic":
        logger.info("automatic model selection")
        logger.info("using gpt-4o")
        return Model(
            model_impl=ChatOpenAI(
                temperature=0,
                model_name="gpt-4o",
                max_tokens=8192,
            ),
            model_name="gpt-4o",
        )
