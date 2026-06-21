from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core import security
from app.db.models import User
from app.db.session import get_db

router = APIRouter()
bearer_scheme = HTTPBearer(auto_error=False)


class LoginRequest(BaseModel):
    username: str
    password: str


def require_authenticated_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="登入憑證無效或已過期",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise unauthorized

    payload = security.decode_access_token(credentials.credentials)
    username = payload.get("sub") if payload else None
    if not username:
        raise unauthorized

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise unauthorized
    return user


@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate a database user and return a JWT access token."""
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not security.verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="帳號或密碼錯誤",
        )

    access_token = security.create_access_token(
        data={"sub": user.username, "role": user.role}
    )

    return {
        "status": "success",
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role,
    }
