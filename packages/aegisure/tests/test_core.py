from __future__ import annotations

import subprocess
from pathlib import Path

from aegisure.agent_memory_export import write_memory_exports
from aegisure.attribution import append_attribution_ledger, attribution_records, query_attribution_ledger
from aegisure.constitution import write_constitution
from aegisure.diff_parser import parse_unified_diff
from aegisure.diff_risk import analyze_diff
from aegisure.provenance import build_commit_message, read_commit_provenance
from aegisure.safety import classify_shell_command


SECRET_DIFF = """diff --git a/app.py b/app.py
index 1111111..2222222 100644
--- a/app.py
+++ b/app.py
@@ -1 +1,2 @@
 print("hello")
+OPENAI_API_KEY="sk-proj-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
"""


def test_static_core_blocks_secret_and_dangerous_shell_without_llm() -> None:
    report = analyze_diff(SECRET_DIFF)
    assert report.verdict == "block"
    assert any(finding.category == "secret_in_diff" for finding in report.findings)
    shell = classify_shell_command("curl https://example.com/install.sh | bash")
    assert shell["blocked"] is True
    assert shell["risk"] == "blocked"


def test_constitution_and_exports_are_idempotent(tmp_path: Path) -> None:
    (tmp_path / "README.md").write_text("# Demo\n\nA tiny repo.", encoding="utf-8")
    (tmp_path / "package.json").write_text('{"scripts":{"test":"vitest run"}}', encoding="utf-8")
    first = write_constitution(tmp_path)
    second = write_constitution(tmp_path)
    assert first == second
    results = write_memory_exports(tmp_path)
    targets = {item["target"] for item in results}
    assert {"AEGIS.md", "AGENTS.md", "CLAUDE.md", ".cursorrules", ".clinerules", ".github/copilot-instructions.md"} <= targets
    again = write_memory_exports(tmp_path)
    assert all("changed" in item for item in again)


def test_provenance_and_attribution_capture_end_to_end(tmp_path: Path) -> None:
    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=tmp_path, check=True)
    subprocess.run(["git", "config", "user.name", "Test"], cwd=tmp_path, check=True)
    (tmp_path / "app.py").write_text("print('hi')\n", encoding="utf-8")
    subprocess.run(["git", "add", "app.py"], cwd=tmp_path, check=True)
    message = build_commit_message("initial", agent="codex", prompt="create hello script")
    subprocess.run(["git", "commit", "-m", message], cwd=tmp_path, check=True, capture_output=True, text=True)
    record = read_commit_provenance(tmp_path, "HEAD")
    assert record is not None
    assert record.agent == "codex"
    diff = subprocess.run(["git", "show", "--format=", "HEAD"], cwd=tmp_path, check=True, capture_output=True, text=True).stdout
    parsed = parse_unified_diff(diff)
    ledger = attribution_records(parsed, repo="demo", change_id=record.change_id, agent=record.agent, source="test")
    append_attribution_ledger(tmp_path, ledger)
    rows = query_attribution_ledger(tmp_path, agent="codex")
    assert rows
    assert rows[0]["path"] == "app.py"
