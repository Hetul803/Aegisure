# Aegisure

Aegisure is the control and audit plane for AI coding agents.

It helps teams see, govern, and remember everything every agent does across Codex, Claude Code, Cursor, Copilot, Cline, Roo, and humans. The static core works offline with zero LLM calls. Optional LLM reasoning can be enabled with Anthropic, OpenAI, or Ollama keys.

## What Works

- CLI: `init`, `scan`, `export`, `review`, `repair`, `commit`, `login`, `doctor`, `run`, `rewind last`
- Static PR/diff risk analysis
- Secret detection and destructive shell-command blocking
- `Aegisure.md` Constitution generation
- Six-format cross-agent memory export
- Provenance and attribution capture
- GitHub App webhook verification and idempotent PR reporting
- FastAPI backend with Supabase JWT/static-token auth
- Workspace-scoped dashboard API
- Next.js dashboard on live backend data
- Waitlist and non-charging founding pledge

## Local Run In Under 10 Minutes

```bash
cp .env.example .env
python -m venv .venv
source .venv/bin/activate
pip install -e packages/aegisure
pip install -e apps/backend pytest fastapi sqlalchemy pyjwt httpx uvicorn alembic psycopg[binary] python-multipart
pnpm install
export AEGISURE_API_TOKEN=dev-token
uvicorn aegisure_backend.main:app --app-dir apps/backend/src --reload
```

In another terminal:

```bash
export AEGISURE_API_TOKEN=dev-token
pnpm web:dev
```

Open [http://localhost:3000](http://localhost:3000).

## CLI Quick Start

```bash
cd /path/to/your/repo
aegisure init
aegisure scan --staged
aegisure doctor
aegisure export
aegisure repair --staged --agent codex
aegisure commit -m "implement feature" --agent codex --prompt "Build the requested feature safely"
```

## GitHub Actions: CLI-Only PR Check

For the simplest team adoption path, copy `.github/workflows/aegisure.yml.example` to `.github/workflows/aegisure.yml` in a repository that uses Aegisure:

```yaml
name: Aegisure

on:
  pull_request:
    branches: ["**"]

jobs:
  scan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: python -m pip install aegisure
      - run: aegisure scan --changed --base origin/${{ github.base_ref }} --json
```

`aegisure scan --json` emits stable machine-readable JSON and exits non-zero only on a blocking verdict.

## Repository Policy

Aegisure reads an optional committed `.aegisure/policy.yml`. If the file is absent, sensible defaults apply. Example:

```yaml
ignore:
  - ".venv/**"
  - "node_modules/**"
protected_paths:
  - ".env*"
  - "apps/backend/auth/**"
  - "apps/backend/billing/**"
approval_required:
  - auth_change
  - schema_change
  - dependency_change
block:
  - secret_in_diff
  - destructive_command
  - test_removal
```

Ignored paths respect `.gitignore` first and are backed by defaults for `.venv/`, `node_modules/`, build output, caches, and `site-packages/`. To remove a built-in ignore, use:

```yaml
ignore:
  remove:
    - "dist/**"
  add:
    - "vendor/generated/**"
```

## Git-Based Safety Commands

`aegisure run` starts a minimal session by recording the current git commit. Aegisure does not execute or control an agent. After your agent work, run `aegisure run --end` to scan the produced diff and record a session history entry.

`aegisure rewind last` is a safe wrapper over `git revert` for the most recent Aegisure-tagged commit. It refuses to run with uncommitted work and asks for confirmation unless `--yes` is provided.

## GitHub App Local Test

1. Create a GitHub App with Pull Requests, Checks, Contents, Metadata, and Issues permissions.
2. Set `AEGISURE_GITHUB_APP_ID`, `AEGISURE_GITHUB_APP_PRIVATE_KEY_PATH`, and `AEGISURE_GITHUB_WEBHOOK_SECRET`.
3. Forward webhooks to `http://localhost:8000/github/webhook` with smee.io or a similar tunnel.
4. Open a risky PR with a fake API key or deleted test file.
5. Confirm Aegisure posts one Check Run and one idempotent PR comment.

## Deployment Targets

- Web dashboard: Vercel
- FastAPI backend: Railway
- Auth/Postgres/pgvector: Supabase

See [DEPLOY.md](DEPLOY.md) and [VERIFY.md](VERIFY.md).
