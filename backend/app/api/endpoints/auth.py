from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.db.models import User
from app.core import security

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str | None = None
    sso_provider: str | None = None


@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    登入與單一登入 (SSO) 模擬驗證

    支援一般密碼驗證登入，或輸入 sso_provider 進行單一登入模擬驗證。
    登入成功後回傳 JWT Token。
    """
    if request.sso_provider:
        # SSO 模擬登入：直接信任並查詢/建立使用者
        user = db.query(User).filter(User.username == request.username).first()
        if not user:
            user = User(
                username=request.username,
                hashed_password=security.get_password_hash("sso-dummy-password"),
                role="curator",
                sso_provider=request.sso_provider,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
    else:
        # 一般登入
        if not request.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="密碼為必填欄位",
            )
        user = db.query(User).filter(User.username == request.username).first()
        if not user or not security.verify_password(request.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="帳號或密碼錯誤",
            )

    # 產生 JWT Access Token
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
