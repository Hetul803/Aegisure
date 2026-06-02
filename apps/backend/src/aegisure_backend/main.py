from __future__ import annotations

import json
import os
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select

from aegisure.agent_memory_export import build_memory_exports
from aegisure.constitution import scan_repository
from aegisure.crypto_identity import encrypt_text
from aegisure.diff_parser import parse_unified_diff
from aegisure.diff_risk import analyze_diff
from aegisure.llm_provider import LLMProvider, cap_status
from aegisure.policy_engine import default_policy_yaml, evaluate_policy
from aegisure.repair_prompt import generate_repair_prompt
from aegisure.second_opinion import cross_model_second_opinion, heuristic_second_opinion
from aegisure_github.pr_flow import PRFlowResult, process_pull_request_webhook
from aegisure_github.webhooks import WebhookHeaders, WebhookVerificationError, parse_verified_webhook

from .db import (
    agent_memory_exports,
    audit_log,
    attribution_ledger,
    constitutions,
    diff_analyses,
    engine,
    ensure_workspace,
    finding_dismissals,
    founding_pledges,
    github_pull_requests,
    github_repositories,
    init_db,
    insert_json,
    json_ready,
    list_json,
    llm_keys,
    policy_evaluations,
    policy_rules,
    provenance_records,
    record_audit,
    repair_prompts,
    risk_findings,
    second_opinions,
    waitlist_signups,
)
from .security import verify_user

app = FastAPI(title="Aegisure API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("AEGISURE_CORS_ORIGINS", "http://localhost:3000").split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DiffAnalyzeRequest(BaseModel):
    diff: str
    repository_id: str | None = None
    policy_yaml: str | None = None


class ConstitutionGenerateRequest(BaseModel):
    repo_path: str = "."


class ExportRequest(BaseModel):
    repo_path: str = "."


class RepairPromptRequest(BaseModel):
    diff: str
    agent: str = "codex"


class SecondOpinionRequest(BaseModel):
    diff: str
    author_agent: str = "unknown"
    reviewer: str = "anthropic"


class PolicyEvaluateRequest(BaseModel):
    diff: str
    policy_yaml: str = Field(default_factory=default_policy_yaml)


class KeyRequest(BaseModel):
    provider: str
    api_key: str


class WaitlistRequest(BaseModel):
    email: str
    company: str | None = None
    note: str | None = None


class PledgeRequest(BaseModel):
    email: str
    pledged_price: str
    note: str | None = None


class AuditChatRequest(BaseModel):
    question: str
    provider: str = "anthropic"


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict[str, Any]:
    init_db()
    return {"ok": True, "service": "aegisure-api", "version": "0.1.0"}


@app.post("/auth/workspace")
def auth_workspace(user: dict[str, Any] = Depends(verify_user)) -> dict[str, Any]:
    workspace = ensure_workspace(user)
    record_audit(workspace_id=workspace["workspace_id"], user_id=workspace["user_id"], event_type="workspace_attached", message="Authenticated user attached to workspace.")
    return {"workspace": workspace}


@app.get("/repos")
def repos(user: dict[str, Any] = Depends(verify_user)) -> dict[str, Any]:
    ensure_workspace(user)
    with engine.begin() as conn:
        rows = conn.execute(select(github_repositories).where(github_repositories.c.workspace_id == user["workspace_id"])).mappings().all()
    return {"repos": [json_ready(dict(row)) for row in rows]}


@app.get("/models")
def models(user: dict[str, Any] = Depends(verify_user)) -> dict[str, Any]:
    ensure_workspace(user)
    return {
        "models": [
            {"provider": "static", "model": "aegisure-static-core", "available": True, "cost": "free"},
            {"provider": "anthropic", "model": os.getenv("AEGISURE_ANTHROPIC_REVIEW_MODEL", "claude-3-5-haiku-latest"), "available": bool(os.getenv("AEGISURE_ANTHROPIC_API_KEY"))},
            {"provider": "openai", "model": os.getenv("AEGISURE_OPENAI_REVIEW_MODEL", "gpt-4.1-mini"), "available": bool(os.getenv("AEGISURE_OPENAI_API_KEY"))},
            {"provider": "ollama", "model": os.getenv("AEGISURE_OLLAMA_MODEL", "llama3.2"), "available": False},
        ]
    }


@app.get("/risk-reports")
def risk_reports(user: dict[str, Any] = Depends(verify_user)) -> dict[str, Any]:
    ensure_workspace(user)
    rows = list_json(diff_analyses, workspace_id=user["workspace_id"], limit=50)
    reports = []
    for row in rows:
        payload = row.get("payload") or {}
        reports.append({"id": row["id"], **payload, "created_at": row.get("created_at")})
    return {"reports": reports}


@app.post("/diffs/analyze")
def analyze(request: DiffAnalyzeRequest, user: dict[str, Any] = Depends(verify_user)) -> dict[str, Any]:
    ensure_workspace(user)
    parsed = parse_unified_diff(request.diff)
    report = analyze_diff(parsed)
    policy = evaluate_policy(parsed, policy_text=request.policy_yaml or default_policy_yaml(), risk_report=report)
    payload = {**report.to_dict(), "policy_evaluation": policy.to_dict()}
    analysis_id = insert_json(diff_analyses, workspace_id=user["workspace_id"], repository_id=request.repository_id, payload=payload)
    for finding in report.findings:
        insert_json(risk_findings, workspace_id=user["workspace_id"], repository_id=request.repository_id, payload=finding.to_dict())
    record_audit(workspace_id=user["workspace_id"], user_id=user["user_id"], event_type="diff_analyzed", message=f"Analyzed diff with verdict {report.verdict}.", payload={"analysis_id": analysis_id, "score": report.score})
    return {"analysis_id": analysis_id, "workspace_id": user["workspace_id"], **payload}


@app.post("/repos/constitution/generate")
def generate_constitution(request: ConstitutionGenerateRequest, user: dict[str, Any] = Depends(verify_user)) -> dict[str, Any]:
    ensure_workspace(user)
    constitution = scan_repository(request.repo_path)
    row_id = insert_json(constitutions, workspace_id=user["workspace_id"], payload=constitution.to_dict())
    return {"constitution_id": row_id, "constitution": constitution.to_dict()}


@app.post("/memory/export")
def memory_export(request: ExportRequest, user: dict[str, Any] = Depends(verify_user)) -> dict[str, Any]:
    ensure_workspace(user)
    constitution = scan_repository(request.repo_path)
    exports = build_memory_exports(constitution)
    row_id = insert_json(agent_memory_exports, workspace_id=user["workspace_id"], payload={"targets": list(exports)})
    return {"export_id": row_id, "exports": exports}


@app.post("/repair-prompts")
def repair(request: RepairPromptRequest, user: dict[str, Any] = Depends(verify_user)) -> dict[str, Any]:
    ensure_workspace(user)
    report = analyze_diff(request.diff)
    prompt = generate_repair_prompt(risk_report=report, agent=request.agent)
    row_id = insert_json(repair_prompts, workspace_id=user["workspace_id"], payload=prompt.to_dict())
    return {"repair_prompt_id": row_id, **prompt.to_dict()}


@app.post("/second-opinion")
async def second_opinion(request: SecondOpinionRequest, user: dict[str, Any] = Depends(verify_user)) -> dict[str, Any]:
    ensure_workspace(user)
    if request.reviewer == "static":
        opinion = heuristic_second_opinion(request.diff, author_agent=request.author_agent)
    else:
        opinion = await cross_model_second_opinion(request.diff, author_agent=request.author_agent, reviewer=request.reviewer)
    row_id = insert_json(second_opinions, workspace_id=user["workspace_id"], payload=opinion.to_dict())
    return {"second_opinion_id": row_id, **opinion.to_dict()}


@app.post("/policies/evaluate")
def policy_evaluate(request: PolicyEvaluateRequest, user: dict[str, Any] = Depends(verify_user)) -> dict[str, Any]:
    ensure_workspace(user)
    parsed = parse_unified_diff(request.diff)
    report = analyze_diff(parsed)
    evaluation = evaluate_policy(parsed, policy_text=request.policy_yaml, risk_report=report)
    row_id = insert_json(policy_evaluations, workspace_id=user["workspace_id"], payload=evaluation.to_dict())
    return {"policy_evaluation_id": row_id, **evaluation.to_dict()}


@app.get("/policies")
def policies(user: dict[str, Any] = Depends(verify_user)) -> dict[str, Any]:
    ensure_workspace(user)
    rows = list_json(policy_rules, workspace_id=user["workspace_id"], limit=50)
    return {"policies": [json_ready(row) for row in rows], "default_policy_yaml": default_policy_yaml()}


@app.get("/attribution")
def attribution(user: dict[str, Any] = Depends(verify_user)) -> dict[str, Any]:
    ensure_workspace(user)
    rows = list_json(attribution_ledger, workspace_id=user["workspace_id"], limit=200)
    return {"records": [row.get("payload", {}) for row in rows]}


@app.get("/provenance")
def provenance(user: dict[str, Any] = Depends(verify_user)) -> dict[str, Any]:
    ensure_workspace(user)
    rows = list_json(provenance_records, workspace_id=user["workspace_id"], limit=200)
    return {"records": [row.get("payload", {}) for row in rows]}


@app.get("/audit")
def audit(user: dict[str, Any] = Depends(verify_user)) -> dict[str, Any]:
    ensure_workspace(user)
    with engine.begin() as conn:
        rows = conn.execute(select(audit_log).where(audit_log.c.workspace_id == user["workspace_id"]).order_by(audit_log.c.created_at.desc()).limit(100)).mappings().all()
    return {"events": [json_ready(dict(row)) for row in rows]}


@app.post("/audit/chat")
async def audit_chat(request: AuditChatRequest, user: dict[str, Any] = Depends(verify_user)) -> dict[str, Any]:
    ensure_workspace(user)
    audit_rows = list_json(attribution_ledger, workspace_id=user["workspace_id"], limit=50) + list_json(provenance_records, workspace_id=user["workspace_id"], limit=50)
    grounded = json.dumps([row.get("payload", {}) for row in audit_rows], default=str)[:12000]
    prompt = (
        "Answer only from this Aegisure workspace audit/provenance data. "
        "If the data does not answer the question, say so clearly.\n\n"
        f"Question: {request.question}\nData: {grounded}"
    )
    response = await LLMProvider(request.provider, user_id=user["user_id"]).complete(prompt)
    if response.status != "completed":
        return {"answer": "I do not have enough configured LLM access to phrase this answer yet. Static audit data is still available.", "status": response.status, "reason": response.reason, "records_considered": len(audit_rows)}
    return {"answer": response.text, "status": "completed", "records_considered": len(audit_rows)}


@app.get("/settings/llm")
def settings_llm(user: dict[str, Any] = Depends(verify_user)) -> dict[str, Any]:
    ensure_workspace(user)
    return {
        "providers": ["anthropic", "openai", "ollama"],
        "cap_status": cap_status(user["user_id"]),
        "static_core": "LLM-free; always available without API keys.",
    }


@app.post("/settings/llm-key")
def settings_key(request: KeyRequest, user: dict[str, Any] = Depends(verify_user)) -> dict[str, Any]:
    ensure_workspace(user)
    provider = request.provider.lower()
    if provider not in {"anthropic", "openai"}:
        raise HTTPException(status_code=400, detail="Only Anthropic and OpenAI BYOK keys are stored by the server.")
    encrypted = encrypt_text(request.api_key)
    row_id = f"llmkey_{user['user_id']}_{provider}"
    with engine.begin() as conn:
        existing = conn.execute(select(llm_keys.c.id).where((llm_keys.c.workspace_id == user["workspace_id"]) & (llm_keys.c.user_id == user["user_id"]) & (llm_keys.c.provider == provider))).first()
        if existing:
            conn.execute(llm_keys.update().where(llm_keys.c.id == existing[0]).values(encrypted_key=encrypted))
            row_id = existing[0]
        else:
            conn.execute(llm_keys.insert().values(id=row_id, workspace_id=user["workspace_id"], user_id=user["user_id"], provider=provider, encrypted_key=encrypted))
    record_audit(workspace_id=user["workspace_id"], user_id=user["user_id"], event_type="byok_key_saved", message=f"Saved encrypted {provider} BYOK key.")
    return {"stored": True, "provider": provider, "key_id": row_id}


@app.post("/waitlist")
def waitlist(request: WaitlistRequest, user: dict[str, Any] = Depends(verify_user)) -> dict[str, Any]:
    ensure_workspace(user)
    row_id = insert_json(waitlist_signups, workspace_id=user["workspace_id"], payload=request.model_dump())
    return {"ok": True, "waitlist_id": row_id}


@app.post("/pledge")
def pledge(request: PledgeRequest, user: dict[str, Any] = Depends(verify_user)) -> dict[str, Any]:
    ensure_workspace(user)
    row_id = insert_json(founding_pledges, workspace_id=user["workspace_id"], payload={**request.model_dump(), "charges_card": False})
    return {"ok": True, "pledge_id": row_id, "charged": False}


@app.post("/findings/dismiss")
def dismiss_finding(payload: dict[str, Any], user: dict[str, Any] = Depends(verify_user)) -> dict[str, Any]:
    ensure_workspace(user)
    fingerprint = payload.get("fingerprint")
    if not fingerprint:
        raise HTTPException(status_code=400, detail="fingerprint required")
    row_id = insert_json(finding_dismissals, workspace_id=user["workspace_id"], repository_id=payload.get("repository_id"), payload=payload)
    return {"dismissed": True, "dismissal_id": row_id}


@app.post("/github/webhook")
async def github_webhook(request: Request) -> dict[str, Any]:
    raw = await request.body()
    secret = os.getenv("GITHUB_WEBHOOK_SECRET") or os.getenv("AEGISURE_GITHUB_WEBHOOK_SECRET") or ""
    headers = WebhookHeaders(
        event=request.headers.get("x-github-event", ""),
        delivery_id=request.headers.get("x-github-delivery", ""),
        signature_256=request.headers.get("x-hub-signature-256", ""),
    )
    try:
        event, duplicate = parse_verified_webhook(raw, headers, secret=secret)
    except WebhookVerificationError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    if duplicate:
        return {"ok": True, "processed": False, "duplicate": True}
    result = await process_pull_request_webhook(event, enable_second_opinion=os.getenv("AEGISURE_ENABLE_SECOND_OPINION", "false").lower() == "true")
    _persist_pr_result(event, result)
    return {"ok": True, "processed": result.processed, "reason": result.reason, "risk_report": result.risk_report}


def _persist_pr_result(event: Any, result: PRFlowResult) -> None:
    if not result.processed or not event.repository or not event.pull_request:
        return
    workspace_id = f"gh_installation_{event.installation_id}"
    repo_id = f"github_{event.repository.id or event.repository.full_name.replace('/', '_')}"
    pr_id = f"{repo_id}_{event.pull_request.number}"
    report = result.risk_report or {}
    with engine.begin() as conn:
        if not conn.execute(select(github_repositories.c.repository_id).where(github_repositories.c.repository_id == repo_id)).first():
            conn.execute(
                github_repositories.insert().values(
                    repository_id=repo_id,
                    workspace_id=workspace_id,
                    github_id=event.repository.id or 0,
                    full_name=event.repository.full_name,
                    name=event.repository.name,
                    risk=report.get("score", 0),
                    status=report.get("verdict", "pass"),
                    open_prs=1,
                )
            )
        values = {
            "workspace_id": workspace_id,
            "repository_id": repo_id,
            "number": event.pull_request.number,
            "title": event.pull_request.title,
            "head_sha": event.pull_request.head_sha,
            "state": "open",
            "risk_score": report.get("score", 0),
            "verdict": report.get("verdict", "pass"),
        }
        if conn.execute(select(github_pull_requests.c.pull_request_id).where(github_pull_requests.c.pull_request_id == pr_id)).first():
            conn.execute(github_pull_requests.update().where(github_pull_requests.c.pull_request_id == pr_id).values(**values))
        else:
            conn.execute(github_pull_requests.insert().values(pull_request_id=pr_id, **values))
    insert_json(diff_analyses, workspace_id=workspace_id, repository_id=repo_id, payload=report)
    for finding in report.get("findings", []):
        insert_json(risk_findings, workspace_id=workspace_id, repository_id=repo_id, payload=finding)
    for record in report.get("attribution", []):
        insert_json(attribution_ledger, workspace_id=workspace_id, repository_id=repo_id, payload=record)
    record_audit(workspace_id=workspace_id, user_id=None, event_type="github_pr_analyzed", message=f"Analyzed PR #{event.pull_request.number} in {event.repository.full_name}.", payload={"verdict": report.get("verdict"), "score": report.get("score")})
