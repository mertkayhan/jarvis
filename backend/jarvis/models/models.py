from typing import Optional
import logging

from jarvis.models import VENDOR_MODEL_MAPPING
from jarvis.models.antrophic import antrophic_model_resolver
from jarvis.models.google import google_model_resolver
from jarvis.models.openai import openai_model_resolver
from jarvis.models.type import Model

logger = logging.getLogger(__name__)


def model_factory(
    model_selection: str,
    token_count: Optional[int] = None,
    provider: Optional[str] = None,
) -> Model:

    token_count = token_count or 0

    if model_selection == "automatic":
        logger.info("automatic model selection")
        if token_count > 100_000:
            logger.info(
                f"using claude-3-5-sonnet-20241022 due to semi large document - tokens: {token_count}"
            )
            logger.info("using ")
            return Model(
                model_impl=antrophic_model_resolver("claude-3-5-sonnet-20241022"),
                model_name="claude-3-5-sonnet-20241022",
            )
        elif token_count > 200_000:
            logger.info(
                f"using gemini-1.5-pro-002 due to large document - tokens: {token_count}"
            )
            return Model(
                model_impl=google_model_resolver("gemini-1.5-pro-002"),
                model_name="gemini-1.5-pro-002",
            )
        else:
            logger.info("using gpt-4o")
            return Model(
                model_impl=openai_model_resolver("gpt-4o"), model_name="gpt-4o"
            )

    provider = provider or VENDOR_MODEL_MAPPING.get(model_selection)
    assert provider, "provider is required for model resolution!"

    if provider == "antrophic":
        return Model(
            model_impl=antrophic_model_resolver(model_selection),
            model_name=model_selection,
        )

    if provider == "google":
        return Model(
            model_impl=google_model_resolver(model_selection),
            model_name=model_selection,
        )

    # openai
    return Model(
        model_impl=openai_model_resolver(model_selection),
        model_name=model_selection,
    )
