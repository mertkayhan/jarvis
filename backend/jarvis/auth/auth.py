from auth0.authentication.token_verifier import (
    TokenVerifier,
    AsymmetricSignatureVerifier,
)
import os
from dotenv import load_dotenv

load_dotenv()
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
assert AUTH0_DOMAIN, "AUTH0_DOMAIN is not set!"
assert not AUTH0_DOMAIN.startswith("http"), "AUTH0_DOMAIN should not start with http!"

JWKS_URL = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
ISSUER = f"https://{AUTH0_DOMAIN}/"
SV = AsymmetricSignatureVerifier(JWKS_URL)

AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE")
assert AUTH0_AUDIENCE, "AUTH0_AUDIENCE is not set!"


def validate_token(token: str):
    if not token:
        raise ValueError("token is null")
    if len(token) == 0:
        raise ValueError("token length is zero")
    if not isinstance(token, str):
        raise ValueError("token is not string type")

    tv = TokenVerifier(
        signature_verifier=SV,
        issuer=ISSUER,
        audience=AUTH0_AUDIENCE,  # type: ignore
    )
    tv.verify(token)
