from __future__ import annotations

import asyncio
import json
import subprocess
from pathlib import Path
from typing import Optional

import typer

from .agent_memory_export import write_memory_exports
from .attribution import append_attribution_ledger, attribution_records, infer_agent
from .constitution import write_constitution, constitution_for_repo
from .diff_parser import parse_unified_diff
from .diff_risk import analyze_diff
from .policy_engine import default_policy_yaml, evaluate_policy
from .provenance import build_commit_message, prompt_hash, read_commit_provenance, record_git_note
from .repair_prompt import generate_repair_prompt
from .second_opinion import cross_model_second_opinion, heuristic_second_opinion

app = typer.Typer(help="Aegisure: control and audit plane for AI coding agents.")


def _repo(path: str | Path = ".") -> Path:
    return Path(path).resolve()


def _selected_repo(repo: Path | None, path: Path | None) -> Path:
    return _repo(path or repo or ".")


def _run_git(repo: Path, args: list[str], *, check: bool = True) -> subprocess.CompletedProcess[str]:
    proc = subprocess.run(["git", *args], cwd=repo, capture_output=True, text=True)
    if check and proc.returncode != 0:
        raise typer.BadParameter(proc.stderr.strip() or proc.stdout.strip() or f"git {' '.join(args)} failed")
    return proc


def _diff_text(repo: Path, *, staged: bool = False, base: Optional[str] = None) -> str:
    if base:
        return _run_git(repo, ["diff", base]).stdout
    if staged:
        return _run_git(repo, ["diff", "--cached"]).stdout
    text = _run_git(repo, ["diff"]).stdout
    return text or _run_git(repo, ["diff", "--cached"]).stdout


@app.command()
def init(
    repo: Path | None = typer.Argument(None, help="Repository to scan."),
    path: Path | None = typer.Option(None, "--path", help="Repository to scan."),
    overwrite: bool = typer.Option(False, help="Overwrite existing AEGIS.md."),
) -> None:
    """Scan a repository and generate the canonical AEGIS.md Constitution."""

    target = write_constitution(_selected_repo(repo, path), overwrite=overwrite)
    typer.echo(f"Generated {target}")


@app.command()
def export(
    repo: Path | None = typer.Argument(None, help="Repository to export memory files into."),
    path: Path | None = typer.Option(None, "--path", help="Repository to export memory files into."),
) -> None:
    """Export AEGIS.md into standard agent memory files."""

    results = write_memory_exports(_selected_repo(repo, path), overwrite=True)
    for result in results:
        marker = "updated" if result["changed"] else "unchanged"
        typer.echo(f"{marker}: {result['target']}")


@app.command()
def scan(
    repo: Path | None = typer.Argument(None, help="Repository to scan."),
    path: Path | None = typer.Option(None, "--path", help="Repository to scan."),
    staged: bool = typer.Option(False, "--staged", help="Analyze staged changes."),
    base: Optional[str] = typer.Option(None, "--base", help="Git ref to diff against."),
    json_output: bool = typer.Option(False, "--json", help="Emit JSON."),
) -> None:
    """Analyze a local diff using the LLM-free static core."""

    repo_path = _selected_repo(repo, path)
    diff = _diff_text(repo_path, staged=staged, base=base)
    constitution = constitution_for_repo(repo_path)
    report = analyze_diff(diff, constitution=constitution)
    policy = evaluate_policy(diff, policy_text=default_policy_yaml(), risk_report=report)
    payload = {**report.to_dict(), "policy_evaluation": policy.to_dict()}
    if json_output:
        typer.echo(json.dumps(payload, indent=2, sort_keys=True))
        if report.verdict == "block":
            raise typer.Exit(1)
        return
    typer.echo(f"Aegisure verdict: {report.verdict} ({report.score}/100)")
    typer.echo(report.summary)
    for finding in report.findings:
        location = f"{finding.path}:{finding.line}" if finding.line else finding.path
        typer.echo(f"- {finding.severity.upper()} {finding.category} at {location}: {finding.explanation}")
    if not policy.passed:
        typer.echo("Policy violations:")
        for violation in policy.violations:
            typer.echo(f"- {violation.severity.upper()} {violation.rule_id}: {violation.explanation}")
    if report.verdict == "block":
        raise typer.Exit(1)


@app.command()
def repair(
    repo: Path | None = typer.Argument(None, help="Repository to inspect."),
    path: Path | None = typer.Option(None, "--path", help="Repository to inspect."),
    staged: bool = typer.Option(False, "--staged", help="Use staged diff."),
    agent: str = typer.Option("codex", "--agent", help="Target agent for the repair prompt."),
) -> None:
    """Generate a constrained repair prompt for the current risky diff."""

    repo_path = _selected_repo(repo, path)
    diff = _diff_text(repo_path, staged=staged)
    constitution = constitution_for_repo(repo_path)
    report = analyze_diff(diff, constitution=constitution)
    prompt = generate_repair_prompt(risk_report=report, constitution=constitution, agent=agent)
    typer.echo(prompt.prompt)


@app.command()
def review(
    repo: Path | None = typer.Argument(None, help="Repository to inspect."),
    path: Path | None = typer.Option(None, "--path", help="Repository to inspect."),
    staged: bool = typer.Option(False, "--staged", help="Use staged diff."),
    provider: str = typer.Option("static", "--provider", help="static, anthropic, openai, or ollama."),
) -> None:
    """Run a second opinion on the current diff."""

    diff = _diff_text(_selected_repo(repo, path), staged=staged)
    if provider == "static":
        opinion = heuristic_second_opinion(diff)
    else:
        opinion = asyncio.run(cross_model_second_opinion(diff, author_agent="unknown", reviewer=provider))
    typer.echo(json.dumps(opinion.to_dict(), indent=2, sort_keys=True))


@app.command()
def commit(
    message: str = typer.Option(..., "-m", "--message", help="Commit message."),
    agent: str = typer.Option(..., "--agent", help="Agent name: codex, claude-code, cursor, copilot, cline, roo, human."),
    prompt: str = typer.Option(..., "--prompt", help="Prompt that produced the change."),
    repo: Path | None = typer.Option(None, "--repo", help="Repository to commit."),
    path: Path | None = typer.Option(None, "--path", help="Repository to commit."),
) -> None:
    """Create a git commit and capture provenance + attribution."""

    repo_path = _selected_repo(repo, path)
    final_message = build_commit_message(message, agent=agent, prompt=prompt)
    _run_git(repo_path, ["commit", "-m", final_message])
    sha = _run_git(repo_path, ["rev-parse", "HEAD"]).stdout.strip()
    record = read_commit_provenance(repo_path, sha)
    if record:
        record_git_note(repo_path, sha, record)
    diff = _run_git(repo_path, ["show", "--format=", "--find-renames", sha]).stdout
    parsed = parse_unified_diff(diff)
    ledger = attribution_records(parsed, repo=repo_path.name, change_id=prompt_hash(prompt), agent=infer_agent(explicit_agent=agent), source="cli_commit")
    append_attribution_ledger(repo_path, ledger)
    typer.echo(f"Committed {sha} and recorded {len(ledger)} attribution entries.")


@app.command()
def login(workspace: str = typer.Option("local", "--workspace", help="Workspace id or slug."), token: str = typer.Option("", "--token", help="Optional dashboard API token.")) -> None:
    """Store local workspace login metadata for CLI use."""

    from .state import record_audit_event
    from .storage.db import init_db

    init_db()
    record_audit_event({"workspace_id": workspace, "event_type": "cli_login", "message": "CLI workspace login configured.", "payload": {"token_configured": bool(token)}})
    typer.echo(f"CLI configured for workspace `{workspace}`. Static scans remain local-first.")


def main() -> None:
    app()


if __name__ == "__main__":
    main()
