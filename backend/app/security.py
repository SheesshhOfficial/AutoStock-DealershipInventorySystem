from datetime import datetime, timedelta, timezone
import jwt
from pwdlib import PasswordHash

password_hasher = PasswordHash.recommended()
# A real hash prevents an unknown email from skipping the expensive verification.
DUMMY_HASH = password_hasher.hash("not-a-real-account-password")


def hash_password(password):
    return password_hasher.hash(password)


def verify_password(password, stored_hash):
    return password_hasher.verify(password, stored_hash)


def create_token(user_id, settings):
    now = datetime.now(timezone.utc)
    claims = {"sub": str(user_id), "iat": now, "exp": now + timedelta(minutes=settings.access_token_minutes)}
    return jwt.encode(claims, settings.jwt_secret, algorithm="HS256")
