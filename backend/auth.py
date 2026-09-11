import hashlib
import os

SECRET_SALT = "farmiq_salt_2026"

def get_password_hash(password: str) -> str:
    return hashlib.sha256((password + SECRET_SALT).encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return get_password_hash(plain_password) == hashed_password

def create_access_token(data: dict) -> str:
    # Generates bearer token (in simple setup, returns the subject email)
    return data.get("sub", "user")
