from typing import TypedDict
import jwt
import os
from dotenv import load_dotenv

load_dotenv()


class Claims(TypedDict):
    sub: str
    role: str
    iat: int
    aud: str
    exp: int
    iss: str
    jti: str
    nbf: int


def validate_token(token: str) -> Claims:
    secret = os.getenv("AUTH0_SECRET")
    assert secret, "'AUTH0_SECRET' is not set!"
    payload = jwt.decode(
        token,
        secret,
        algorithms=["HS256"],
        verify=True,
        audience=os.getenv("AUTH0_AUDIENCE"),
        issuer=os.getenv("CORS_ALLOWED_ORIGINS", "").split(";"),
        options={
            "verify_exp": True,
            "verify_iat": True,
            "verify_aud": True,
            "verify_iss": True,
            "require": ["exp", "iat", "aud", "iss", "sub", "role"],
        },
    )
    return payload
