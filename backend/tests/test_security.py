import time
from app.core import security

def test_password_hashing_and_verification():
    password = "my-secure-password"
    hashed = security.get_password_hash(password)
    assert hashed != password
    assert security.verify_password(password, hashed) is True
    assert security.verify_password("wrong-password", hashed) is False

def test_jwt_token_generation_and_decoding():
    data = {"sub": "testuser", "role": "admin"}
    token = security.create_access_token(data)
    assert token is not None
    assert len(token.split(".")) == 3

    decoded = security.decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "testuser"
    assert decoded["role"] == "admin"
    assert "exp" in decoded

def test_jwt_token_invalid_signature():
    token = security.create_access_token({"sub": "testuser"})
    parts = token.split(".")
    # Modify payload base64 string slightly
    forged_token = parts[0] + "." + parts[1] + "forged" + "." + parts[2]
    assert security.decode_access_token(forged_token) is None

def test_jwt_token_expired():
    # Force expired token by patching ACCESS_TOKEN_EXPIRE_MINUTES
    security.ACCESS_TOKEN_EXPIRE_MINUTES = -10
    token = security.create_access_token({"sub": "testuser"})
    decoded = security.decode_access_token(token)
    assert decoded is None
    # Restore it
    security.ACCESS_TOKEN_EXPIRE_MINUTES = 60
