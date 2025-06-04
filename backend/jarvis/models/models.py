import os
from typing import Optional
import logging

from jarvis.models import VENDOR_MODEL_MAPPING
from jarvis.models.antrophic import antrophic_model_resolver
from jarvis.models.google import google_model_resolver
from jarvis.models.openai import openai_model_resolver
from jarvis.models.type import Model

logger = logging.getLogger(__name__)


def get_default_model():
    return os.getenv("DEFAULT_MODEL", "gpt-4.1")


def model_factory(
    model_selection: str,
    token_count: Optional[int] = None,
    provider: Optional[str] = None,
) -> Model:

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
