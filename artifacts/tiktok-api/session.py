"""
TT Session Token System
Generates short-lived signed tokens per request to prevent CSRF + bot abuse
"""
import hashlib
import hmac
import os
import time
import secrets
import logging
from typing import Optional

logger = logging.getLogger(__name__)

SECRET_KEY = os.environ.get("SESSION_SECRET", secrets.token_hex(32))
TOKEN_TTL = 300  # 5 minutes per token

_used_tokens: dict[str, float] = {}  # token -> issued_at


def _cleanup_tokens():
    now = time.time()
    expired = [t for t, ts in _used_tokens.items() if now - ts > TOKEN_TTL * 2]
    for t in expired:
        del _used_tokens[t]


def generate_token() -> str:
    """Generate a signed session token."""
    _cleanup_tokens()  # purge expired tokens on every generation, not just on verify
    nonce = secrets.token_urlsafe(16)
    ts = str(int(time.time()))
    payload = f"{nonce}:{ts}"
    sig = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    token = f"{payload}:{sig}"
    return token


def verify_token(token: str) -> tuple[bool, str]:
    """
    Verify token. Returns (is_valid, reason).
    Tokens are single-use to prevent replay attacks.
    """
    _cleanup_tokens()

    if not token:
        return False, "missing_token"

    parts = token.split(":")
    if len(parts) != 3:
        return False, "malformed_token"

    nonce, ts_str, sig = parts

    # Check signature
    payload = f"{nonce}:{ts_str}"
    expected_sig = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected_sig):
        return False, "invalid_signature"

    # Check expiry
    try:
        issued_at = int(ts_str)
    except ValueError:
        return False, "invalid_timestamp"

    if time.time() - issued_at > TOKEN_TTL:
        return False, "token_expired"

    # Check replay
    if token in _used_tokens:
        return False, "token_already_used"

    _used_tokens[token] = time.time()
    return True, "ok"
