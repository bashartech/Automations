import hashlib
from datetime import datetime, timedelta, timezone
from app.config import get_settings


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    return hash_password(password) == password_hash


def create_token(user_id: str) -> str:
    settings = get_settings()
    payload = f"{user_id}:{int((datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expiry_hours)).timestamp())}"
    sig = hashlib.sha256(f"{payload}:{settings.jwt_secret}".encode()).hexdigest()
    return f"{payload}:{sig}"


def decode_token(token: str) -> str:
    settings = get_settings()
    parts = token.split(":")
    if len(parts) != 3:
        raise ValueError("Invalid token")
    user_id, exp_str, sig = parts
    expected_sig = hashlib.sha256(f"{user_id}:{exp_str}:{settings.jwt_secret}".encode()).hexdigest()
    if sig != expected_sig:
        raise ValueError("Invalid signature")
    if int(exp_str) < datetime.now(timezone.utc).timestamp():
        raise ValueError("Token expired")
    return user_id
