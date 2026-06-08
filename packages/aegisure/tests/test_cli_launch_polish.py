from __future__ import annotations

import json
import subprocess
from pathlib import Path

from typer.testing import CliRunner

from aegisure.agent_memory_export import build_memory_exports
from aegisure.cli import app
from aegisure.constitution import scan_repository, write_constitution
from aegisure.policy_config import DEFAULT_IGNORE_PATTERNS, load_aegisure_policy, path_is_ignored


runner = CliRunner()


def git(repo: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(["git", *args], cwd=repo, check=True, capture_output=True, text=True)


def init_repo(repo: Path) -> None:
    git(repo, "init")
    git(repo, "config", "user.email", "test@example.com")
    git(repo, "config", "user.name", "Aegisure Test")
    (repo / "README.md").write_text("# Demo\n", encoding="utf-8")
    git(repo, "add", "README.md")
    git(repo, "commit", "-m", "initial")
    git(repo, "branch", "-M", "main")


def test_venv_and_gitignored_vendor_paths_never_surface(tmp_path: Path) -> None:
    init_repo(tmp_path)
    (tmp_path / ".gitignore").write_text(".venv/\n", encoding="utf-8")
    vendor = tmp_path / ".venv" / "lib" / "python3.12" / "site-packages" / "httpx"
    vendor.mkdir(parents=True)
    vendor_file = vendor / "_auth.py"
    vendor_file.write_text('OPENAI_API_KEY="sk-proj-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"\n', encoding="utf-8")
    git(tmp_path, "add", ".gitignore")
    subprocess.run(["git", "add", "-f", ".venv/lib/python3.12/site-packages/httpx/_auth.py"], cwd=tmp_path, check=True)
    git(tmp_path, "commit", "-m", "force tracked vendor file")
    vendor_file.write_text('OPENAI_API_KEY="sk-proj-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"\n', encoding="utf-8")

    constitution = scan_repository(tmp_path)
    result = runner.invoke(app, ["scan", "--path", str(tmp_path), "--json"])

    assert result.exit_code == 0
    assert not any(".venv" in path or "site-packages" in path or "httpx/_auth.py" in path for path in constitution.protected_paths)
    payload = json.loads(result.stdout)
    assert payload["files_changed"] == 0
    assert payload["findings"] == []


def test_tracked_venv_never_appears_in_repair_scan_or_constitution_without_gitignore(tmp_path: Path) -> None:
    init_repo(tmp_path)
    vendor_files = [
        tmp_path / ".venv" / "lib" / "python3.12" / "site-packages" / "httpx" / "_auth.py",
        tmp_path / ".venv" / "lib" / "python3.12" / "site-packages" / "pip" / "_internal" / "network" / "auth.py",
        tmp_path / ".venv" / "lib" / "python3.12" / "site-packages" / "pygments-2.20.0.dist-info" / "licenses" / "AUTHORS",
    ]
    for file in vendor_files:
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text("auth boundary fixture\n", encoding="utf-8")
    git(tmp_path, "add", ".")
    git(tmp_path, "commit", "-m", "track virtualenv by mistake")

    stale_protected = [str(path.relative_to(tmp_path)) for path in vendor_files]
    (tmp_path / "Aegisure.md").write_text(
        "\n".join(
            [
                "# Aegisure Constitution for stale",
                "",
                "## Protected Paths",
                *(f"- `{path}`" for path in stale_protected),
                "",
                "<!-- AEGISURE_CONSTITUTION_JSON",
                json.dumps(
                    {
                        "schema_version": 1,
                        "repo_name": "stale",
                        "summary": "stale",
                        "languages": ["Python"],
                        "package_files": [],
                        "test_commands": [],
                        "protected_paths": stale_protected,
                        "agent_rules": [],
                        "approval_rules": [],
                        "memory_exports": [],
                    },
                    sort_keys=True,
                ),
                "AEGISURE_CONSTITUTION_JSON -->",
            ]
        ),
        encoding="utf-8",
    )
    (tmp_path / "app.py").write_text('OPENAI_API_KEY="sk-proj-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"\n', encoding="utf-8")
    git(tmp_path, "add", "app.py")

    repair = runner.invoke(app, ["repair", "--path", str(tmp_path), "--staged", "--agent", "codex"])
    scan = runner.invoke(app, ["scan", "--path", str(tmp_path), "--staged", "--json"])
    constitution = scan_repository(tmp_path)

    combined = repair.stdout + scan.stdout + "\n".join(constitution.protected_paths)
    assert repair.exit_code == 0
    assert scan.exit_code == 1
    assert "app.py" in repair.stdout
    assert ".venv/" not in combined
    assert "site-packages" not in combined
    assert "httpx/_auth.py" not in combined
    assert "pip/_internal/network/auth.py" not in combined
    assert "pygments-2.20.0.dist-info/licenses/AUTHORS" not in combined


def test_export_preserves_user_authored_agent_file_content(tmp_path: Path) -> None:
    init_repo(tmp_path)
    user_rules = "User rule: always keep the hand-written Cursor instructions.\n"
    (tmp_path / ".cursorrules").write_text(user_rules, encoding="utf-8")

    first = runner.invoke(app, ["export", "--path", str(tmp_path)])
    second = runner.invoke(app, ["export", "--path", str(tmp_path)])
    content = (tmp_path / ".cursorrules").read_text(encoding="utf-8")

    assert first.exit_code == 0
    assert second.exit_code == 0
    assert user_rules.strip() in content
    assert "You are an AI coding agent" in content
    assert content.count("User rule:") == 1
    assert content.count("AEGISURE:BEGIN") == 1
    assert content.count("AEGISURE:END") == 1


def test_custom_named_tracked_virtualenv_is_ignored_everywhere(tmp_path: Path) -> None:
    init_repo(tmp_path)
    vendor_files = [
        tmp_path / ".venv-aegisure" / "pyvenv.cfg",
        tmp_path / ".venv-aegisure" / "lib" / "python3.12" / "site-packages" / "httpx" / "_auth.py",
        tmp_path / ".venv-aegisure" / "lib" / "python3.12" / "site-packages" / "pip" / "_internal" / "network" / "auth.py",
    ]
    for file in vendor_files:
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text("vendor auth fixture\n", encoding="utf-8")
    git(tmp_path, "add", ".")
    git(tmp_path, "commit", "-m", "track custom named virtualenv by mistake")
    (tmp_path / "app.py").write_text('OPENAI_API_KEY="sk-proj-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"\n', encoding="utf-8")
    git(tmp_path, "add", "app.py")

    scan = runner.invoke(app, ["scan", "--path", str(tmp_path), "--staged", "--json"])
    repair = runner.invoke(app, ["repair", "--path", str(tmp_path), "--staged", "--agent", "codex"])
    export = runner.invoke(app, ["export", "--path", str(tmp_path)])
    constitution = scan_repository(tmp_path)
    exported_text = "\n".join(path.read_text(encoding="utf-8", errors="replace") for path in [
        tmp_path / "Aegisure.md",
        tmp_path / "AGENTS.md",
        tmp_path / "CLAUDE.md",
        tmp_path / ".cursorrules",
        tmp_path / ".clinerules",
        tmp_path / ".github" / "copilot-instructions.md",
    ])

    combined = scan.stdout + repair.stdout + export.stdout + "\n".join(constitution.protected_paths) + exported_text
    assert scan.exit_code == 1
    assert repair.exit_code == 0
    assert export.exit_code == 0
    assert "app.py" in repair.stdout
    assert ".venv-aegisure" not in combined
    assert "site-packages" not in combined
    assert "httpx/_auth.py" not in combined
    assert "pip/_internal/network/auth.py" not in combined
    assert "package.json" not in constitution.protected_paths


def test_doctor_ignores_vendor_and_does_not_hard_fail_doc_placeholders(tmp_path: Path) -> None:
    init_repo(tmp_path)
    vendor = tmp_path / "venv-aegisure" / "lib" / "python3.12" / "site-packages" / "httpcore"
    vendor.mkdir(parents=True)
    (tmp_path / "venv-aegisure" / "pyvenv.cfg").write_text("home = /usr/bin/python\n", encoding="utf-8")
    (vendor / "_auth.py").write_text('OPENAI_API_KEY="sk-proj-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"\n', encoding="utf-8")
    (tmp_path / "README.md").write_text(
        "# Demo\n\nExample only: `OPENAI_API_KEY=sk-proj-your_api_key_here_placeholder`.\n",
        encoding="utf-8",
    )
    git(tmp_path, "add", ".")
    git(tmp_path, "commit", "-m", "tracked vendor and docs placeholder")

    result = runner.invoke(app, ["doctor", "--path", str(tmp_path)])

    assert result.exit_code == 0
    assert "Committed/working-tree secrets" in result.stdout
    assert "Potential secrets found" not in result.stdout
    assert "venv-aegisure" not in result.stdout
    assert "Documentation secret placeholders" in result.stdout


def test_doctor_flags_secret_values_not_env_references_or_key_names(tmp_path: Path) -> None:
    init_repo(tmp_path)
    service = tmp_path / "apps" / "backend" / "src" / "services"
    service.mkdir(parents=True)
    (service / "llmParser.ts").write_text(
        """
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export const parserConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  tokenSource: process.env.AUTH_TOKEN,
};
""".strip(),
        encoding="utf-8",
    )
    (tmp_path / "apps" / "backend").mkdir(parents=True, exist_ok=True)
    (tmp_path / "apps" / "backend" / ".env.example").write_text("OPENAI_API_KEY=\nAUTH_TOKEN=\n", encoding="utf-8")
    (tmp_path / "menu.ts").write_text(
        """
export const menu = {
  label: "Models",
  max_output_tokens: 1200,
  secretMenuItem: false,
};
""".strip(),
        encoding="utf-8",
    )
    git(tmp_path, "add", ".")
    git(tmp_path, "commit", "-m", "safe env references and templates")
    (service / "hardcodedSecret.ts").write_text(
        'export const leaked = "sk-proj-realfakekey1234567890abcdef";\n',
        encoding="utf-8",
    )
    git(tmp_path, "add", "apps/backend/src/services/hardcodedSecret.ts")

    doctor = runner.invoke(app, ["doctor", "--path", str(tmp_path)])
    scan = runner.invoke(app, ["scan", "--path", str(tmp_path), "--staged", "--json"])

    assert doctor.exit_code == 1
    assert "Potential secrets found in: apps/backend/src/services/hardcodedSecret.ts" in doctor.stdout
    assert "llmParser.ts" not in doctor.stdout
    assert ".env.example" not in doctor.stdout
    assert "menu.ts" not in doctor.stdout
    assert scan.exit_code == 1
    payload = json.loads(scan.stdout)
    assert any(finding["path"] == "apps/backend/src/services/hardcodedSecret.ts" for finding in payload["findings"])


def test_doctor_does_not_flag_asset_urls_or_env_example_templates(tmp_path: Path) -> None:
    init_repo(tmp_path)
    app_dir = tmp_path / "apps" / "web" / "src"
    app_dir.mkdir(parents=True)
    (app_dir / "gallery.ts").write_text(
        """
export const hero = {
  image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?q=80&w=1200&auto=format&fit=crop',
  title: 'Launch image',
};
""".strip(),
        encoding="utf-8",
    )
    backend = tmp_path / "apps" / "backend"
    backend.mkdir(parents=True)
    (backend / ".env.example").write_text(
        """
PORT=4000
AI_PROVIDER=local
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OLLAMA_HOST=http://localhost:11434
""".strip()
        + "\n",
        encoding="utf-8",
    )
    git(tmp_path, "add", ".")
    git(tmp_path, "commit", "-m", "safe url and env template")

    safe_doctor = runner.invoke(app, ["doctor", "--path", str(tmp_path)])

    assert safe_doctor.exit_code == 0
    assert "Potential secrets found" not in safe_doctor.stdout
    assert "gallery.ts" not in safe_doctor.stdout
    assert ".env.example" not in safe_doctor.stdout

    (tmp_path / "apps" / "backend" / "hardcoded.ts").write_text(
        'const OPENAI_API_KEY = "sk-proj-realfakekey1234567890abcdef";\n',
        encoding="utf-8",
    )
    git(tmp_path, "add", "apps/backend/hardcoded.ts")
    hardcoded_doctor = runner.invoke(app, ["doctor", "--path", str(tmp_path)])
    hardcoded_scan = runner.invoke(app, ["scan", "--path", str(tmp_path), "--staged", "--json"])

    assert hardcoded_doctor.exit_code == 1
    assert "Potential secrets found in: apps/backend/hardcoded.ts" in hardcoded_doctor.stdout
    assert "gallery.ts" not in hardcoded_doctor.stdout
    assert ".env.example" not in hardcoded_doctor.stdout
    assert hardcoded_scan.exit_code == 1
    payload = json.loads(hardcoded_scan.stdout)
    assert any(finding["path"] == "apps/backend/hardcoded.ts" for finding in payload["findings"])


def test_policy_file_drives_paths_categories_and_ignores(tmp_path: Path) -> None:
    init_repo(tmp_path)
    policy_dir = tmp_path / ".aegisure"
    policy_dir.mkdir()
    (policy_dir / "policy.yml").write_text(
        """
ignore:
  - "vendor/**"
protected_paths:
  - "apps/backend/auth/**"
approval_required:
  - auth_change
block:
  - secret_in_diff
""".strip(),
        encoding="utf-8",
    )
    (tmp_path / "apps" / "backend" / "auth").mkdir(parents=True)
    (tmp_path / "apps" / "backend" / "auth" / "login.py").write_text("def login():\n    return True\n", encoding="utf-8")
    (tmp_path / "vendor").mkdir()
    (tmp_path / "vendor" / "auth.py").write_text("auth = True\n", encoding="utf-8")
    git(tmp_path, "add", ".")
    git(tmp_path, "commit", "-m", "policy baseline")
    (tmp_path / "apps" / "backend" / "auth" / "login.py").write_text("def login():\n    role = 'admin'\n    return role\n", encoding="utf-8")
    (tmp_path / "vendor" / "auth.py").write_text("auth = False\n", encoding="utf-8")

    policy = load_aegisure_policy(tmp_path)
    result = runner.invoke(app, ["scan", "--path", str(tmp_path), "--json"])

    assert "vendor/**" in policy.ignore
    assert path_is_ignored(tmp_path, "vendor/auth.py", policy)
    assert result.exit_code == 0
    payload = json.loads(result.stdout)
    assert payload["files_changed"] == 1
    assert payload["policy_evaluation"]["passed"] is False
    assert any(violation["decision"] == "require_review" for violation in payload["policy_evaluation"]["violations"])


def test_policy_defaults_when_absent(tmp_path: Path) -> None:
    policy = load_aegisure_policy(tmp_path)

    assert ".venv/**" in policy.ignore
    assert set(DEFAULT_IGNORE_PATTERNS) <= set(policy.ignore)
    assert "secret_in_diff" in policy.block


def test_doctor_reports_useful_readiness(tmp_path: Path) -> None:
    init_repo(tmp_path)
    (tmp_path / ".gitignore").write_text(".env\n.env.*\n", encoding="utf-8")
    write_constitution(tmp_path)
    runner.invoke(app, ["export", "--path", str(tmp_path)])

    result = runner.invoke(app, ["doctor", "--path", str(tmp_path)])

    assert result.exit_code == 0
    assert "Git repository" in result.stdout
    assert "Summary:" in result.stdout


def test_changed_scan_mode_outputs_machine_readable_json(tmp_path: Path) -> None:
    init_repo(tmp_path)
    git(tmp_path, "checkout", "-b", "feature")
    (tmp_path / "app.py").write_text('OPENAI_API_KEY="sk-proj-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"\n', encoding="utf-8")
    git(tmp_path, "add", "app.py")
    git(tmp_path, "commit", "-m", "risky")

    result = runner.invoke(app, ["scan", "--path", str(tmp_path), "--changed", "--base", "main", "--json"])

    assert result.exit_code == 1
    payload = json.loads(result.stdout)
    assert payload["verdict"] == "block"
    assert any(finding["category"] == "secret_in_diff" for finding in payload["findings"])


def test_rewind_last_uses_git_revert_without_dirty_worktree(tmp_path: Path) -> None:
    init_repo(tmp_path)
    (tmp_path / "feature.py").write_text("print('ok')\n", encoding="utf-8")
    git(tmp_path, "add", "feature.py")
    commit = runner.invoke(app, ["commit", "-m", "agent feature", "--agent", "codex", "--prompt", "add feature", "--path", str(tmp_path)])

    rewind = runner.invoke(app, ["rewind", "last", "--path", str(tmp_path), "--yes"])
    log = git(tmp_path, "log", "-1", "--format=%s").stdout.strip()

    assert commit.exit_code == 0
    assert rewind.exit_code == 0
    assert log.startswith("Revert")


def test_run_session_snapshot_and_end_records_history(tmp_path: Path) -> None:
    init_repo(tmp_path)

    start = runner.invoke(app, ["run", "--path", str(tmp_path)])
    (tmp_path / "app.py").write_text('OPENAI_API_KEY="sk-proj-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"\n', encoding="utf-8")
    end = runner.invoke(app, ["run", "--path", str(tmp_path), "--end", "--json"])

    assert start.exit_code == 0
    assert end.exit_code == 1
    payload = json.loads(end.stdout)
    assert payload["risk"]["verdict"] == "block"
    assert (tmp_path / ".aegisure" / "run-history.jsonl").exists()


def test_exported_agent_files_request_declared_commit_attribution(tmp_path: Path) -> None:
    constitution = scan_repository(tmp_path)
    exports = build_memory_exports(constitution)

    assert "--agent codex" in exports["AGENTS.md"]
    assert "--agent claude-code" in exports["CLAUDE.md"]
    assert "--agent cursor" in exports[".cursorrules"]
    assert "Attribution is declared" not in exports["AGENTS.md"]


def test_help_alias_and_init_animation_auto_disable(tmp_path: Path) -> None:
    help_result = runner.invoke(app, ["help"])
    init_result = runner.invoke(app, ["init", "--path", str(tmp_path)])

    assert help_result.exit_code == 0
    assert "Aegisure: control and audit plane" in help_result.stdout
    assert init_result.exit_code == 0
    assert "◆" not in init_result.stdout
