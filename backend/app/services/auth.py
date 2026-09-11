import hashlib
import hmac
import secrets
import json
import base64
import time
from typing import Optional, Dict, Any

SECRET_KEY = "paanipanchayat_secret_jwt_key_super_secure"

def hash_password(password: str) -> str:
    """Hashes a password with a randomly generated salt using SHA-256."""
    salt = secrets.token_hex(16)
    pw_hash = hashlib.sha256((salt + password).encode('utf-8')).hexdigest()
    return f"{salt}${pw_hash}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a stored salt$hash string."""
    try:
        if "$" not in hashed_password:
            return False
        salt, stored_hash = hashed_password.split("$", 1)
        calc_hash = hashlib.sha256((salt + plain_password).encode('utf-8')).hexdigest()
        return hmac.compare_digest(calc_hash, stored_hash)
    except Exception:
        return False

def create_access_token(user_id: int, email: str, role: str, name: str) -> str:
    """Creates a lightweight signed auth token."""
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "name": name,
        "exp": int(time.time()) + (24 * 3600 * 7) # 7 days validity
    }
    payload_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode('utf-8').rstrip('=')
    
    signature = hmac.new(SECRET_KEY.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{signature}"

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a signed auth token."""
    try:
        if "." not in token:
            return None
        payload_b64, signature = token.split(".", 1)
        expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected_sig):
            return None
        
        padding = '=' * (4 - len(payload_b64) % 4)
        payload_json = base64.urlsafe_b64decode((payload_b64 + padding).encode('utf-8')).decode('utf-8')
        payload = json.loads(payload_json)
        
        if payload.get("exp", 0) < time.time():
            return None
        
        return payload
    except Exception:
        return None
