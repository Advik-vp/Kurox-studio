from datetime import UTC, datetime, timedelta
from hashlib import sha256
from typing import Any
from uuid import uuid4

import bcrypt
from jose import JWTError, jwt

from app.core.config import get_settings

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(subject: str, extra: dict[str, Any] | None = None) -> str:
    settings = get_settings()
    expire = datetime.now(UTC) + timedelta(minutes=settings.access_ttl_min)
    payload = {"sub": subject, "exp": expire, "type": "access", **(extra or {})}
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def create_refresh_token(subject: str, family_id: str | None = None) -> tuple[str, str, datetime]:
    settings = get_settings()
    family = family_id or str(uuid4())
    expire = datetime.now(UTC) + timedelta(days=settings.refresh_ttl_days)
    payload = {
        "sub": subject,
        "exp": expire,
        "type": "refresh",
        "fam": family,
        "jti": str(uuid4()),
    }
    token = jwt.encode(payload, settings.jwt_refresh_secret, algorithm=ALGORITHM)
    return token, family, expire


def decode_access(token: str) -> dict[str, Any]:
    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])


def decode_refresh(token: str) -> dict[str, Any]:
    settings = get_settings()
    return jwt.decode(token, settings.jwt_refresh_secret, algorithms=[ALGORITHM])


def hash_token(token: str) -> str:
    return sha256(token.encode()).hexdigest()


def verify_token_hash(token: str, hashed: str) -> bool:
    return sha256(token.encode()).hexdigest() == hashed


__all__ = [
    "JWTError",
    "create_access_token",
    "create_refresh_token",
    "decode_access",
    "decode_refresh",
    "hash_password",
    "hash_token",
    "verify_password",
    "verify_token_hash",
]
