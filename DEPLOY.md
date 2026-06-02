# Aegisure Deploy Guide

Aegisure deploys as three hosted pieces:

- Web dashboard: Vercel, project root `apps/web`
- FastAPI backend and GitHub webhook: Railway, repo root
- Database and auth: Supabase Postgres + pgvector + Supabase Auth

No real secrets belong in this repository. Use the names below exactly and paste real values only into Vercel, Railway, Supabase, or your local shell.

## Supabase

Supabase provides GitHub login, hosted Postgres, and pgvector.

Aegisure uses the classic JWT-style Supabase keys:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` for server-side Supabase admin work if you add it later
- `SUPABASE_JWT_SECRET` for FastAPI JWT verification

Do not mix these with the newer `sb_publishable_` / `sb_secret_` naming in this codebase unless you intentionally migrate the frontend and backend together.

### Run migrations against Supabase

The migration enables pgvector with `CREATE EXTENSION IF NOT EXISTS vector`, creates the workspace-scoped tables, and turns on RLS policies. Run this from the repo root after replacing the placeholders:

```bash
DATABASE_URL="postgresql+psycopg://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" alembic upgrade head
```

If Supabase reports that `vector` is unavailable, enable the Vector extension in the Supabase dashboard, then rerun the command.

## Vercel Web Dashboard

Project root:

```text
repo root
```

Build command:

```bash
pnpm --filter aegisure-web build
```

Required Vercel env vars:

```bash
NEXT_PUBLIC_AEGISURE_BACKEND_URL=https://api.aegisure.dev
AEGISURE_BACKEND_URL=https://api.aegisure.dev
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[SUPABASE_ANON_KEY]
```

Optional Vercel env vars:

```bash
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Development-only fallback:

```bash
AEGISURE_API_TOKEN=
AEGISURE_WORKSPACE_ID=local
```

Use the fallback token only for local/test dashboards. Hosted production should rely on Supabase user sessions.

## Railway Backend

Railway should install from the repo root with `requirements.txt`. `Procfile` starts the API:

```bash
uvicorn aegisure_backend.main:app --app-dir apps/backend/src --host 0.0.0.0 --port $PORT
```

Required Railway env vars:

```bash
DATABASE_URL=postgresql+psycopg://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
SUPABASE_JWT_SECRET=[SUPABASE_JWT_SECRET]
AEGISURE_CORS_ORIGINS=https://aegisure.dev
AEGISURE_GITHUB_APP_ID=[GITHUB_APP_ID]
AEGISURE_GITHUB_APP_PRIVATE_KEY=[MULTILINE_PRIVATE_KEY_WITH_ESCAPED_NEWLINES_OR_REAL_MULTILINE_VALUE]
AEGISURE_GITHUB_WEBHOOK_SECRET=[GITHUB_WEBHOOK_SECRET]
```

Local-only alternative for GitHub private key:

```bash
AEGISURE_GITHUB_APP_PRIVATE_KEY_PATH=/absolute/path/to/private-key.pem
```

Optional Railway env vars:

```bash
AEGISURE_API_TOKEN=[DEV_ONLY_STATIC_TOKEN]
AEGISURE_PROVIDED_DAILY_CAP_USD=0.25
AEGISURE_ENABLE_SECOND_OPINION=false
AEGISURE_ANTHROPIC_API_KEY=
AEGISURE_ANTHROPIC_REVIEW_MODEL=claude-3-5-haiku-latest
AEGISURE_OPENAI_API_KEY=
AEGISURE_OPENAI_REVIEW_MODEL=gpt-4.1-mini
AEGISURE_OLLAMA_BASE_URL=http://127.0.0.1:11434
AEGISURE_OLLAMA_MODEL=llama3.2
SENTRY_DSN=
```

Railway provides `PORT` automatically.

## GitHub App

Required permissions:

- Checks: read/write
- Pull requests: read
- Issues: read/write
- Contents: read
- Metadata: read

Webhook events:

- Pull request

When you deploy, update these external URLs:

```text
GitHub App Homepage URL: https://aegisure.dev
GitHub App Webhook URL: https://api.aegisure.dev/github/webhook
GitHub App callback URL if using direct OAuth: https://aegisure.dev/auth
Supabase allowed redirect URL: https://aegisure.dev/auth
Supabase allowed redirect URL: https://aegisure.dev/onboarding
Supabase allowed redirect URL: https://aegisure.dev/dashboard
Supabase local redirect URL: http://localhost:3000/auth
Supabase local redirect URL: http://localhost:3000/onboarding
```

If you use Supabase’s GitHub provider, also add the Supabase callback URL shown in the Supabase dashboard to the GitHub OAuth app.

## Local Webhook Test

Use smee.io or another tunnel to forward GitHub webhooks to:

```text
http://127.0.0.1:8000/github/webhook
```

Then set the GitHub App webhook URL to your tunnel URL during local testing.

## PyPI

Do not publish from CI. See [PUBLISH.md](PUBLISH.md).
