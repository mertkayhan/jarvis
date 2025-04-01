from auth0.authentication.token_verifier import (
    TokenVerifier,
    AsymmetricSignatureVerifier,
)
import os
from dotenv import load_dotenv

load_dotenv()
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
JWKS_URL = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
ISSUER = f"https://{AUTH0_DOMAIN}/"
SV = AsymmetricSignatureVerifier(JWKS_URL)


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
        audience=os.getenv("AUTH0_AUDIENCE"),
    )
    tv.verify(token)
