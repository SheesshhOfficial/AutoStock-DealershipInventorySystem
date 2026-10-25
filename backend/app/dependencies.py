import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.models import User

bearer = HTTPBearer(auto_error=False)


def get_session(request: Request):
    with request.app.state.session_factory() as session:
        yield session


def current_user(request: Request, credentials: HTTPAuthorizationCredentials | None = Depends(bearer), session=Depends(get_session)):
    unauthorized = HTTPException(401, "Please log in again", headers={"WWW-Authenticate": "Bearer"})
    if credentials is None:
        raise unauthorized
    try:
        payload = jwt.decode(credentials.credentials, request.app.state.settings.jwt_secret, algorithms=["HS256"], options={"require": ["sub", "exp"]})
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise unauthorized
    user = session.get(User, user_id)
    if user is None:
        raise unauthorized
    return user


def admin_user(user=Depends(current_user)):
    if user.role != "admin":
        raise HTTPException(403, "Administrator access required")
    return user
