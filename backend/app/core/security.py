import hmac
import hashlib
import base64
import json
import time

SECRET_KEY = "library-system-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def base64url_decode(data: str) -> bytes:
    padding = '=' * (4 - len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)

def get_password_hash(password: str) -> str:
    # 使用 Python 標準庫實現 PBKDF2 密碼雜湊
    salt = b"library_salt_123"
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return dk.hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return get_password_hash(plain_password) == hashed_password

def create_access_token(data: dict) -> str:
    header = {"alg": ALGORITHM, "typ": "JWT"}
    payload = data.copy()
    payload["exp"] = int(time.time()) + ACCESS_TOKEN_EXPIRE_MINUTES * 60

    header_json = json.dumps(header, separators=(',', ':')).encode('utf-8')
    payload_json = json.dumps(payload, separators=(',', ':')).encode('utf-8')

    signing_input = base64url_encode(header_json) + "." + base64url_encode(payload_json)
    signature = hmac.new(SECRET_KEY.encode('utf-8'), signing_input.encode('utf-8'), hashlib.sha256).digest()

    return signing_input + "." + base64url_encode(signature)

def decode_access_token(token: str) -> dict | None:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        signing_input = parts[0] + "." + parts[1]
        signature = base64url_decode(parts[2])

        expected_signature = hmac.new(SECRET_KEY.encode('utf-8'), signing_input.encode('utf-8'), hashlib.sha256).digest()

        if not hmac.compare_digest(signature, expected_signature):
            return None

        payload_json = base64url_decode(parts[1])
        payload = json.loads(payload_json.decode('utf-8'))

        if "exp" in payload and payload["exp"] < time.time():
            return None

        return payload
    except Exception:
        return None
