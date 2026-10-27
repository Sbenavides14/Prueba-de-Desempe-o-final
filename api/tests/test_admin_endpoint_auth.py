"""Pruebo mi endpoint de admin: sin token debe rechazar, y un viewer no puede usarlo."""
import os

os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("APP_DB_HOST", "localhost")
os.environ.setdefault("APP_DB_PORT", "5432")
os.environ.setdefault("APP_DB_NAME", "test")
os.environ.setdefault("READER_DB_USER", "test")
os.environ.setdefault("READER_DB_PASSWORD", "test")
os.environ.setdefault("TRANSFORMER_DB_USER", "test")
os.environ.setdefault("TRANSFORMER_DB_PASSWORD", "test")
os.environ.setdefault("APP_ADMIN_EMAIL", "admin@test.local")
os.environ.setdefault("APP_ADMIN_PASSWORD", "test")

from fastapi.testclient import TestClient

from app.auth import create_access_token

# Evito que mi api intente sembrar el admin contra una base real durante este test.
import app.main as main_module
main_module.seed_admin_user = lambda: None

client = TestClient(main_module.app)


def test_backfill_without_token_is_rejected():
    response = client.post("/api/admin/backfill", json={})
    assert response.status_code == 401


def test_backfill_with_viewer_role_is_forbidden():
    token = create_access_token(email="viewer@test.local", role="viewer")
    response = client.post(
        "/api/admin/backfill",
        json={},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
