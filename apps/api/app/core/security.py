import bcrypt
from datetime import datetime, timezone, timedelta
from jose import jwt, JWTError
from app.core.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def create_access_token(user_id: str, role: str, email: str, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=7))
    payload = {
        "sub": user_id,
        "role": role,
        "email": email,
        "exp": expire
    }
    return jwt.encode(payload, settings.AUTH_SECRET, algorithm="HS256")

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.AUTH_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        return {}
