from __future__ import annotations

import json
import os
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import JSON, Boolean, Column, DateTime, Integer, MetaData, String, Table, Text, create_engine, select
from sqlalchemy.engine import Engine

metadata = MetaData()

workspaces = Table(
    "workspaces",
    metadata,
    Column("workspace_id", String, primary_key=True),
    Column("name", String, nullable=False),
    Column("created_at", DateTime(timezone=True), default=lambda: datetime.now(UTC)),
)
users = Table(
    "users",
    metadata,
    Column("user_id", String, primary_key=True),
    Column("email", String, nullable=False),
    Column("display_name", String),
    Column("created_at", DateTime(timezone=True), default=lambda: datetime.now(UTC)),
)
workspace_members = Table(
    "workspace_members",
    metadata,
    Column("workspace_id", String, primary_key=True),
    Column("user_id", String, primary_key=True),
    Column("role", String, nullable=False, default="owner"),
)
github_repositories = Table(
    "github_repositories",
    metadata,
    Column("repository_id", String, primary_key=True),
    Column("workspace_id", String, nullable=False, index=True),
    Column("github_id", Integer),
    Column("full_name", String, nullable=False),
    Column("name", String),
    Column("default_branch", String, default="main"),
    Column("private", Boolean, default=False),
    Column("risk", Integer, default=0),
    Column("status", String, default="connected"),
    Column("open_prs", Integer, default=0),
    Column("created_at", DateTime(timezone=True), default=lambda: datetime.now(UTC)),
)
github_pull_requests = Table(
    "github_pull_requests",
    metadata,
    Column("pull_request_id", String, primary_key=True),
    Column("workspace_id", String, nullable=False, index=True),
    Column("repository_id", String, nullable=False, index=True),
    Column("number", Integer, nullable=False),
    Column("title", String, nullable=False),
    Column("head_sha", String, nullable=False),
    Column("state", String, nullable=False, default="open"),
    Column("risk_score", Integer, default=0),
    Column("verdict", String, default="pass"),
    Column("created_at", DateTime(timezone=True), default=lambda: datetime.now(UTC)),
)


def json_table(name: str) -> Table:
    return Table(
        name,
        metadata,
        Column("id", String, primary_key=True),
        Column("workspace_id", String, nullable=False, index=True),
        Column("repository_id", String, index=True),
        Column("payload", JSON, nullable=False, default=dict),
        Column("created_at", DateTime(timezone=True), default=lambda: datetime.now(UTC)),
    )


diff_analyses = json_table("diff_analyses")
risk_findings = json_table("risk_findings")
constitutions = json_table("constitutions")
constitution_versions = json_table("constitution_versions")
agent_memory_exports = json_table("agent_memory_exports")
repair_prompts = json_table("repair_prompts")
second_opinions = json_table("second_opinions")
provenance_records = json_table("provenance_records")
attribution_ledger = json_table("attribution_ledger")
policy_rules = json_table("policy_rules")
policy_evaluations = json_table("policy_evaluations")
agent_failure_records = json_table("agent_failure_records")
waitlist_signups = json_table("waitlist_signups")
founding_pledges = json_table("founding_pledges")
finding_dismissals = json_table("finding_dismissals")
llm_keys = Table(
    "llm_keys",
    metadata,
    Column("id", String, primary_key=True),
    Column("workspace_id", String, nullable=False, index=True),
    Column("user_id", String, nullable=False, index=True),
    Column("provider", String, nullable=False),
    Column("encrypted_key", Text, nullable=False),
    Column("created_at", DateTime(timezone=True), default=lambda: datetime.now(UTC)),
)
audit_log = Table(
    "audit_log",
    metadata,
    Column("id", String, primary_key=True),
    Column("workspace_id", String, nullable=False, index=True),
    Column("user_id", String),
    Column("event_type", String, nullable=False),
    Column("message", Text, nullable=False),
    Column("payload", JSON, nullable=False, default=dict),
    Column("created_at", DateTime(timezone=True), default=lambda: datetime.now(UTC)),
)


def database_url() -> str:
    return os.getenv("DATABASE_URL") or os.getenv("AEGISURE_DATABASE_URL") or "sqlite:///./.aegisure/backend.sqlite3"


def get_engine() -> Engine:
    url = database_url()
    if url.startswith("sqlite"):
        os.makedirs(".aegisure", exist_ok=True)
        return create_engine(url, connect_args={"check_same_thread": False})
    return create_engine(url, pool_pre_ping=True)


engine = get_engine()


def init_db() -> None:
    metadata.create_all(engine)


def _id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


def ensure_workspace(user: dict[str, Any]) -> dict[str, str]:
    init_db()
    workspace_id = str(user.get("workspace_id") or f"ws_{user['user_id']}")
    email = str(user.get("email") or f"{user['user_id']}@local")
    with engine.begin() as conn:
        if not conn.execute(select(workspaces.c.workspace_id).where(workspaces.c.workspace_id == workspace_id)).first():
            conn.execute(workspaces.insert().values(workspace_id=workspace_id, name=f"{email.split('@')[0]}'s workspace"))
        if not conn.execute(select(users.c.user_id).where(users.c.user_id == user["user_id"])).first():
            conn.execute(users.insert().values(user_id=user["user_id"], email=email, display_name=user.get("display_name")))
        if not conn.execute(
            select(workspace_members.c.workspace_id).where(
                (workspace_members.c.workspace_id == workspace_id) & (workspace_members.c.user_id == user["user_id"])
            )
        ).first():
            conn.execute(workspace_members.insert().values(workspace_id=workspace_id, user_id=user["user_id"], role="owner"))
    return {"workspace_id": workspace_id, "user_id": user["user_id"], "email": email}


def insert_json(table: Table, *, workspace_id: str, payload: dict[str, Any], repository_id: str | None = None, row_id: str | None = None) -> str:
    row_id = row_id or _id(table.name)
    with engine.begin() as conn:
        conn.execute(table.insert().values(id=row_id, workspace_id=workspace_id, repository_id=repository_id, payload=payload))
    return row_id


def list_json(table: Table, *, workspace_id: str, limit: int = 50) -> list[dict[str, Any]]:
    with engine.begin() as conn:
        rows = conn.execute(select(table).where(table.c.workspace_id == workspace_id).order_by(table.c.created_at.desc()).limit(limit)).mappings().all()
    return [dict(row) for row in rows]


def record_audit(*, workspace_id: str, user_id: str | None, event_type: str, message: str, payload: dict[str, Any] | None = None) -> str:
    row_id = _id("audit")
    with engine.begin() as conn:
        conn.execute(
            audit_log.insert().values(
                id=row_id,
                workspace_id=workspace_id,
                user_id=user_id,
                event_type=event_type,
                message=message,
                payload=payload or {},
            )
        )
    return row_id


def json_ready(row: dict[str, Any]) -> dict[str, Any]:
    result = dict(row)
    if isinstance(result.get("created_at"), datetime):
        result["created_at"] = result["created_at"].replace(tzinfo=UTC).isoformat()
    try:
        json.dumps(result.get("payload", {}))
    except TypeError:
        result["payload"] = json.loads(json.dumps(result["payload"], default=str))
    return result
