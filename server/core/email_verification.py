from __future__ import annotations

import random
import re
import smtplib
from dataclasses import dataclass
from datetime import datetime, timedelta
from email.message import EmailMessage
from threading import Lock

from config import settings

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@dataclass
class CacheValue:
    value: str
    expires_at: datetime


_auth_cache: dict[str, CacheValue] = {}
_verified_cache: dict[str, CacheValue] = {}
_cache_lock = Lock()


def normalize_email(email: str) -> str:
    return email.strip().lower()


def is_valid_email(email: str) -> bool:
    return bool(EMAIL_PATTERN.match(email))


def parse_allowed_domain_map() -> dict[str, str]:
    mapping: dict[str, str] = {}
    raw = settings.ALLOWED_UNIVERSITY_DOMAINS or ""

    for item in raw.split(","):
        if ":" not in item:
            continue
        domain, university = item.split(":", 1)
        domain = domain.strip().lower()
        university = university.strip()
        if domain and university:
            mapping[domain] = university

    return mapping


def extract_university(email: str) -> str | None:
    normalized = normalize_email(email)
    if "@" not in normalized:
        return None

    domain = normalized.rsplit("@", 1)[1]
    allowed = parse_allowed_domain_map()

    if domain in allowed:
        return allowed[domain]

    for allowed_domain, university in allowed.items():
        if domain.endswith(f".{allowed_domain}"):
            return university

    return None


def _purge_expired(cache: dict[str, CacheValue]) -> None:
    now = datetime.utcnow()
    expired_keys = [key for key, value in cache.items() if value.expires_at <= now]
    for key in expired_keys:
        cache.pop(key, None)


def _set_cache(cache: dict[str, CacheValue], key: str, value: str, ttl_seconds: int) -> None:
    expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)
    cache[key] = CacheValue(value=value, expires_at=expires_at)


def _get_cache_value(cache: dict[str, CacheValue], key: str) -> str | None:
    _purge_expired(cache)
    entry = cache.get(key)
    if not entry:
        return None
    return entry.value


def generate_verification_code() -> str:
    return f"{random.randint(0, 999_999):06d}"


def store_auth_code(email: str, code: str) -> None:
    normalized = normalize_email(email)
    with _cache_lock:
        _set_cache(_auth_cache, normalized, code, settings.EMAIL_CODE_TTL_SECONDS)


def verify_auth_code(email: str, code: str) -> bool:
    normalized = normalize_email(email)
    with _cache_lock:
        cached = _get_cache_value(_auth_cache, normalized)
        if not cached or cached != code:
            return False
        _auth_cache.pop(normalized, None)
        return True


def mark_email_verified(email: str, university: str) -> None:
    normalized = normalize_email(email)
    with _cache_lock:
        _set_cache(
            _verified_cache,
            normalized,
            university,
            settings.EMAIL_VERIFIED_TTL_SECONDS,
        )


def get_verified_university(email: str) -> str | None:
    normalized = normalize_email(email)
    with _cache_lock:
        return _get_cache_value(_verified_cache, normalized)


def clear_verification_state(email: str) -> None:
    normalized = normalize_email(email)
    with _cache_lock:
        _auth_cache.pop(normalized, None)
        _verified_cache.pop(normalized, None)


def send_verification_email(email: str, code: str) -> None:
    if settings.EMAIL_VERIFICATION_DEV_MODE:
        print(f"[EMAIL DEV MODE] Verification code for {email}: {code}")
        return

    if not settings.SMTP_HOST or not settings.SMTP_SENDER:
        raise RuntimeError("SMTP_HOST and SMTP_SENDER are required in non-dev mode.")

    msg = EmailMessage()
    msg["Subject"] = "[Campus Turf War] School email verification code"
    msg["From"] = settings.SMTP_SENDER
    msg["To"] = email
    msg.set_content(
        "Your verification code is "
        f"{code}. It expires in {settings.EMAIL_CODE_TTL_SECONDS // 60} minutes."
    )

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as smtp:
        if settings.SMTP_USE_TLS:
            smtp.starttls()
        if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
            smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        smtp.send_message(msg)
