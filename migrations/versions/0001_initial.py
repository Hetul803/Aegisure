"""pivot core tables

Revision ID: 0001_pivot_core
Revises:
Create Date: 2026-05-31
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0001_pivot_core"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.create_table(
        "workspaces",
        sa.Column("workspace_id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_table(
        "users",
        sa.Column("user_id", sa.String(), primary_key=True),
        sa.Column("email", sa.String(), nullable=False, unique=True),
        sa.Column("display_name", sa.String()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_table(
        "workspace_members",
        sa.Column("workspace_id", sa.String(), sa.ForeignKey("workspaces.workspace_id", ondelete="CASCADE"), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True),
        sa.Column("role", sa.String(), nullable=False, server_default="member"),
    )
    op.create_table(
        "github_installations",
        sa.Column("workspace_id", sa.String(), nullable=False, index=True),
        sa.Column("installation_id", sa.BigInteger(), primary_key=True),
        sa.Column("account_login", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_table(
        "github_repositories",
        sa.Column("repository_id", sa.String(), primary_key=True),
        sa.Column("workspace_id", sa.String(), nullable=False, index=True),
        sa.Column("github_id", sa.BigInteger(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("name", sa.String()),
        sa.Column("default_branch", sa.String(), nullable=False, server_default="main"),
        sa.Column("private", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("risk", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(), nullable=False, server_default="connected"),
        sa.Column("open_prs", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_table(
        "github_pull_requests",
        sa.Column("pull_request_id", sa.String(), primary_key=True),
        sa.Column("workspace_id", sa.String(), nullable=False, index=True),
        sa.Column("repository_id", sa.String(), nullable=False, index=True),
        sa.Column("number", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("head_sha", sa.String(), nullable=False),
        sa.Column("state", sa.String(), nullable=False),
        sa.Column("risk_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("verdict", sa.String(), nullable=False, server_default="pass"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    for table in [
        "diff_analyses",
        "risk_findings",
        "constitutions",
        "constitution_versions",
        "agent_memory_exports",
        "repair_prompts",
        "second_opinions",
        "provenance_records",
        "attribution_ledger",
        "policy_rules",
        "policy_evaluations",
        "agent_failure_records",
        "waitlist_signups",
        "founding_pledges",
        "finding_dismissals",
    ]:
        op.create_table(
            table,
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("workspace_id", sa.String(), nullable=False, index=True),
            sa.Column("repository_id", sa.String(), index=True),
            sa.Column("payload", sa.JSON(), nullable=False, server_default=sa.text("'{}'::jsonb")),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        )
    op.create_table(
        "llm_keys",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("workspace_id", sa.String(), nullable=False, index=True),
        sa.Column("user_id", sa.String(), nullable=False, index=True),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("encrypted_key", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_table(
        "audit_log",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("workspace_id", sa.String(), nullable=False, index=True),
        sa.Column("user_id", sa.String()),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.execute(
        """
        CREATE TABLE memory_timeline_events (
            event_id VARCHAR PRIMARY KEY,
            workspace_id VARCHAR NOT NULL,
            repository_id VARCHAR NOT NULL,
            agent VARCHAR NOT NULL,
            event_type VARCHAR NOT NULL,
            summary VARCHAR NOT NULL,
            payload JSONB NOT NULL DEFAULT '{}'::jsonb,
            embedding vector(1536),
            created_at TIMESTAMPTZ DEFAULT now()
        )
        """
    )
    op.create_index("ix_memory_timeline_events_workspace_id", "memory_timeline_events", ["workspace_id"])
    op.create_index("ix_memory_timeline_events_repository_id", "memory_timeline_events", ["repository_id"])
    op.create_index("ix_memory_timeline_events_agent", "memory_timeline_events", ["agent"])
    workspace_tables = [
        "workspaces",
        "workspace_members",
        "github_installations",
        "github_repositories",
        "github_pull_requests",
        "diff_analyses",
        "risk_findings",
        "constitutions",
        "constitution_versions",
        "agent_memory_exports",
        "repair_prompts",
        "second_opinions",
        "provenance_records",
        "attribution_ledger",
        "policy_rules",
        "policy_evaluations",
        "agent_failure_records",
        "waitlist_signups",
        "founding_pledges",
        "finding_dismissals",
        "llm_keys",
        "audit_log",
        "memory_timeline_events",
    ]
    for table in workspace_tables:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(
            f"""
            CREATE POLICY {table}_workspace_isolation ON {table}
            USING (workspace_id = current_setting('app.workspace_id', true))
            WITH CHECK (workspace_id = current_setting('app.workspace_id', true))
            """
        )


def downgrade() -> None:
    for table in [
        "founding_pledges",
        "finding_dismissals",
        "llm_keys",
        "audit_log",
        "memory_timeline_events",
        "waitlist_signups",
        "agent_failure_records",
        "policy_evaluations",
        "policy_rules",
        "attribution_ledger",
        "provenance_records",
        "second_opinions",
        "repair_prompts",
        "agent_memory_exports",
        "constitution_versions",
        "constitutions",
        "risk_findings",
        "diff_analyses",
        "github_pull_requests",
        "github_repositories",
        "github_installations",
        "workspace_members",
        "users",
        "workspaces",
    ]:
        op.drop_table(table)
