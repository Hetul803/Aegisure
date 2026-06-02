# Aegisure

Aegisure is the control and audit plane for AI coding agents.

It helps teams see, govern, and remember everything every agent does across Codex, Claude Code, Cursor, Copilot, Cline, Roo, and humans. The static core works offline with zero LLM calls. Optional LLM reasoning can be enabled with Anthropic, OpenAI, or Ollama keys.

## What Works

- CLI: `init`, `scan`, `export`, `review`, `repair`, `commit`, `login`
- Static PR/diff risk analysis
- Secret detection and destructive shell-command blocking
- `AEGIS.md` Constitution generation
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
aegisure export
aegisure repair --staged --agent codex
aegisure commit -m "implement feature" --agent codex --prompt "Build the requested feature safely"
```

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
