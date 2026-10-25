from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.dependencies import current_user, get_session
from app.models import User
from app.schemas import Credentials, LoginResponse, UserResponse
from app.security import DUMMY_HASH, create_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(credentials: Credentials, session=Depends(get_session)):
    user = User(email=credentials.email, password_hash=hash_password(credentials.password))
    session.add(user)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(409, "An account with this email already exists")
    return user


@router.post("/login", response_model=LoginResponse)
def login(credentials: Credentials, request: Request, session=Depends(get_session)):
    user = session.scalar(select(User).where(User.email == credentials.email))
    valid = verify_password(credentials.password, user.password_hash if user else DUMMY_HASH)
    if not user or not valid:
        raise HTTPException(401, "Incorrect email or password")
    return LoginResponse(access_token=create_token(user.id, request.app.state.settings), user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def profile(user=Depends(current_user)):
    return user
