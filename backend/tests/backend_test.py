"""Backend tests for Madre: Árvore da Vida (auth, upload/files, reports, logout)."""
import os
import io
import pytest
import requests

BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/") if os.environ.get("EXPO_PUBLIC_BACKEND_URL") else None
if not BASE_URL:
    # Fallback: read from frontend .env
    from pathlib import Path
    env = Path("/app/frontend/.env").read_text()
    for line in env.splitlines():
        if line.startswith("EXPO_PUBLIC_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")

SESSION_TOKEN = "test_session_madre_123"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    return s


@pytest.fixture(scope="module")
def auth_headers():
    return {"Authorization": f"Bearer {SESSION_TOKEN}"}


# ---------- Auth ----------
class TestAuth:
    def test_me_no_token(self, client):
        r = client.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_me_with_token(self, client, auth_headers):
        r = client.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user_id"] == "user_test0001"
        assert data.get("email") == "teste@madre.app"

    def test_session_invalid(self, client):
        r = client.post(f"{BASE_URL}/api/auth/session", json={"session_id": "invalid_xxx"})
        assert r.status_code == 401

    def test_apple_invalid(self, client):
        r = client.post(f"{BASE_URL}/api/auth/apple", json={"identity_token": "not.a.jwt"})
        assert r.status_code == 401


# ---------- Upload / Files ----------
# 1x1 PNG
PNG_1x1 = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0"
    b"\x00\x00\x00\x03\x00\x01\xf6\x178U\x00\x00\x00\x00IEND\xaeB`\x82"
)


class TestUploadFiles:
    def test_upload_requires_auth(self, client):
        files = {"file": ("x.png", io.BytesIO(PNG_1x1), "image/png")}
        r = client.post(f"{BASE_URL}/api/upload", files=files)
        assert r.status_code == 401

    def test_upload_and_download(self, client, auth_headers):
        files = {"file": ("x.png", io.BytesIO(PNG_1x1), "image/png")}
        r = client.post(f"{BASE_URL}/api/upload", files=files, headers=auth_headers)
        assert r.status_code == 200, r.text
        path = r.json()["path"]
        assert path
        pytest.uploaded_path = path
        # GET file
        r2 = client.get(f"{BASE_URL}/api/files/{path}")
        assert r2.status_code == 200
        assert r2.headers.get("content-type", "").startswith("image/")
        assert len(r2.content) > 0


# ---------- Reports ----------
class TestReports:
    def test_create_requires_auth(self, client):
        r = client.post(f"{BASE_URL}/api/reports", json={
            "description": "TEST desmatamento", "category": "desmatamento",
            "latitude": -12.75, "longitude": -38.62
        })
        assert r.status_code == 401

    def test_create_list_delete(self, client, auth_headers):
        payload = {"description": "TEST ponto de denúncia playwright",
                   "category": "desmatamento", "latitude": -12.75, "longitude": -38.62}
        r = client.post(f"{BASE_URL}/api/reports", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        rep = r.json()
        rid = rep["id"]
        assert rep["description"] == payload["description"]
        assert rep["user_id"] == "user_test0001"

        # List
        r2 = client.get(f"{BASE_URL}/api/reports")
        assert r2.status_code == 200
        assert any(x["id"] == rid for x in r2.json())

        # Delete without auth -> 401
        r3 = client.delete(f"{BASE_URL}/api/reports/{rid}")
        assert r3.status_code == 401

        # Delete with auth (owner) -> ok
        r4 = client.delete(f"{BASE_URL}/api/reports/{rid}", headers=auth_headers)
        assert r4.status_code == 200
        assert r4.json().get("ok") is True

        # Verify deleted
        r5 = client.get(f"{BASE_URL}/api/reports")
        assert all(x["id"] != rid for x in r5.json())


# ---------- Logout (run LAST and re-seed) ----------
class TestLogoutAndReseed:
    def test_logout_and_reseed(self, client):
        # logout invalidates session
        r = client.post(f"{BASE_URL}/api/auth/logout",
                        headers={"Authorization": f"Bearer {SESSION_TOKEN}"})
        assert r.status_code == 200

        r2 = client.get(f"{BASE_URL}/api/auth/me",
                        headers={"Authorization": f"Bearer {SESSION_TOKEN}"})
        assert r2.status_code == 401

        # Re-seed for subsequent runs / frontend testing
        import pymongo
        from datetime import datetime, timezone, timedelta
        mc = pymongo.MongoClient("mongodb://localhost:27017")
        d = mc["test_database"]
        now = datetime.now(timezone.utc)
        d.user_sessions.insert_one({
            "session_token": SESSION_TOKEN,
            "user_id": "user_test0001",
            "created_at": now,
            "expires_at": now + timedelta(days=7),
        })
        # Confirm seeded
        r3 = client.get(f"{BASE_URL}/api/auth/me",
                        headers={"Authorization": f"Bearer {SESSION_TOKEN}"})
        assert r3.status_code == 200
