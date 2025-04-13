from .google import SUPPORTED_MODELS as GOOGLE_SUPPORTED_MODELS
from .openai import SUPPORTED_MODELS as OPENAI_SUPPORTED_MODELS
from .antrophic import SUPPORTED_MODELS as ANTROPIC_SUPPORTED_MODELS

ALL_SUPPORTED_MODELS = set(
    [
        *GOOGLE_SUPPORTED_MODELS,
        *OPENAI_SUPPORTED_MODELS,
        *ANTROPIC_SUPPORTED_MODELS,
    ]
)
VENDOR_MODEL_MAPPING = {
    **{model: "google" for model in GOOGLE_SUPPORTED_MODELS.keys()},
    **{model: "openai" for model in OPENAI_SUPPORTED_MODELS.keys()},
    **{model: "antrophic" for model in ANTROPIC_SUPPORTED_MODELS.keys()},
}
