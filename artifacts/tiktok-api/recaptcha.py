"""
reCAPTCHA v3 Bot Protection
Set RECAPTCHA_SECRET in env to enable. Disabled by default (dev mode).

Fail-open on domain/infra errors (hostname-mismatch, timeout).
Fail-closed only on confirmed low-score bots.
"""
import httpx
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

RECAPTCHA_SECRET = os.environ.get("RECAPTCHA_SECRET", "")
RECAPTCHA_MIN_SCORE = float(os.environ.get("RECAPTCHA_MIN_SCORE", "0.5"))
RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"

_enabled = bool(RECAPTCHA_SECRET)

# Errors that mean "wrong domain / infra issue" — fail open so dev works
# and prod works before domain is fully propagated
_DOMAIN_ERRORS = {
    "hostname-mismatch",
    "invalid-input-secret",
    "invalid-keys",
    "bad-request",
    "missing-input-secret",
}


def is_enabled() -> bool:
    return _enabled


async def verify_token(token: Optional[str], remote_ip: Optional[str] = None) -> tuple[bool, float, str]:
    """
    Verify reCAPTCHA v3 token.
    Returns (is_human, score, action)

    Blocking logic:
      - No token            → block (missing_token)
      - Domain/infra error  → allow (fail-open, will enforce on luldown.com)
      - Score < threshold   → block (confirmed bot)
      - Score >= threshold  → allow (human)
      - Network error       → allow (fail-open)
    """
    if not _enabled:
        return True, 1.0, "disabled"

    if not token:
        return False, 0.0, "missing_token"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                RECAPTCHA_VERIFY_URL,
                data={
                    "secret": RECAPTCHA_SECRET,
                    "response": token,
                    **({"remoteip": remote_ip} if remote_ip else {}),
                },
            )
            data = resp.json()

        if not data.get("success"):
            errors = data.get("error-codes", [])
            error_set = set(errors)

            # Domain / config errors → fail-open (dev mode or pre-DNS propagation)
            if error_set & _DOMAIN_ERRORS:
                logger.info(f"reCAPTCHA domain/config error (fail-open): {errors}")
                return True, 1.0, "domain_bypass"

            logger.warning(f"reCAPTCHA verification failed: {errors}")
            return False, 0.0, str(errors)

        score = float(data.get("score", 0.0))
        action = data.get("action", "")

        if score < RECAPTCHA_MIN_SCORE:
            logger.warning(f"reCAPTCHA bot detected — score: {score:.2f}, action: {action}")
            return False, score, action

        logger.info(f"reCAPTCHA passed — score: {score:.2f}, action: {action}")
        return True, score, action

    except Exception as e:
        logger.error(f"reCAPTCHA network error (fail-open): {e}")
        return True, 1.0, "error_bypass"
