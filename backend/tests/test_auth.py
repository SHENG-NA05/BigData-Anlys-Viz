import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from app.api.endpoints.auth import login, LoginRequest, require_authenticated_user
from app.db.models import User
from app.core import security

class FakeDb:
    def __init__(self, user=None):
        self.user = user
        self.added = []
        self.committed = False
        self.refreshed = False

    def query(self, model):
        self.query_model = model
        return self

    def filter(self, *expressions):
        return self

    def first(self):
        return self.user

    def add(self, item):
        self.added.append(item)

    def commit(self):
        self.committed = True

    def refresh(self, item):
        self.refreshed = True

def test_login_standard_success():
    hashed_password = security.get_password_hash("mypassword")
    user = User(username="admin", hashed_password=hashed_password, role="admin")
    db = FakeDb(user=user)

    request = LoginRequest(username="admin", password="mypassword")
    response = login(request, db=db)

    assert response["status"] == "success"
    assert "access_token" in response
    assert response["username"] == "admin"
    assert response["role"] == "admin"

def test_login_standard_failure_wrong_password():
    hashed_password = security.get_password_hash("mypassword")
    user = User(username="admin", hashed_password=hashed_password, role="admin")
    db = FakeDb(user=user)

    request = LoginRequest(username="admin", password="wrongpassword")
    with pytest.raises(HTTPException) as exc_info:
        login(request, db=db)
    assert exc_info.value.status_code == 401
    assert "帳號或密碼錯誤" in exc_info.value.detail

def test_login_unknown_user_does_not_auto_register():
    db = FakeDb(user=None)

    request = LoginRequest(username="unknown", password="password")
    with pytest.raises(HTTPException) as exc_info:
        login(request, db=db)

    assert exc_info.value.status_code == 401
    assert db.added == []
    assert db.committed is False

def test_protected_route_rejects_missing_token():
    with pytest.raises(HTTPException) as exc_info:
        require_authenticated_user(credentials=None, db=FakeDb())

    assert exc_info.value.status_code == 401

def test_protected_route_rejects_invalid_token():
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid")
    with pytest.raises(HTTPException) as exc_info:
        require_authenticated_user(credentials=credentials, db=FakeDb())

    assert exc_info.value.status_code == 401

def test_protected_route_accepts_valid_token_for_existing_user():
    user = User(username="admin", hashed_password="hash", role="admin")
    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials=security.create_access_token({"sub": "admin", "role": "admin"}),
    )

    assert require_authenticated_user(credentials=credentials, db=FakeDb(user=user)) is user
