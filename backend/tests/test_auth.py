import pytest
from fastapi import HTTPException
from app.api.endpoints.auth import login, LoginRequest
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

def test_login_sso_success_auto_registers_user():
    db = FakeDb(user=None) # User doesn't exist initially

    request = LoginRequest(username="sso_user", sso_provider="google")
    response = login(request, db=db)

    assert db.committed is True
    assert db.refreshed is True
    assert len(db.added) == 1
    assert db.added[0].username == "sso_user"
    assert db.added[0].sso_provider == "google"

    assert response["status"] == "success"
    assert "access_token" in response
    assert response["username"] == "sso_user"
