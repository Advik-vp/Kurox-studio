from fastapi.testclient import TestClient

from app.core.security import hash_password, verify_password
from app.main import app

client = TestClient(app)


def test_login_validation():
    res = client.post("/api/v1/auth/login", json={"email": "not-an-email", "password": "x"})
    assert res.status_code in (401, 422)


def test_forgot_password_validation():
    res = client.post("/api/v1/auth/forgot-password", json={"email": "not-an-email"})
    assert res.status_code == 422


def test_password_hash_roundtrip():
    hashed = hash_password("Kurox!studio1")
    assert verify_password("Kurox!studio1", hashed)
    assert not verify_password("wrong-password", hashed)
