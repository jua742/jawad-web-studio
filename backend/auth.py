"""Auth helpers — stdlib password hashing + random session tokens.

No passlib / bcrypt dependency needed. Passwords are hashed with
PBKDF2-HMAC-SHA256 + a random salt. Tokens are random strings stored
in the sessions table. No secrets are in code.
"""
import hashlib
import hmac
import os
import secrets


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200_000)
    return "pbkdf2_sha256$200000$" + salt.hex() + "$" + dk.hex()


def verify_password(password: str, stored: str) -> bool:
    try:
        _, _, salt_hex, hash_hex = stored.split("$")
        salt = bytes.fromhex(salt_hex)
        dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200_000)
        return hmac.compare_digest(dk.hex(), hash_hex)
    except Exception:
        return False


def new_token() -> str:
    return secrets.token_urlsafe(32)
