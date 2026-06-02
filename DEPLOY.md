# Aegisure Deploy Guide

## Supabase

Supabase provides Postgres, pgvector, and GitHub OAuth login.

1. Create a Supabase project.
2. Enable GitHub as an Auth provider.
3. Copy `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_JWT_SECRET` into Vercel/Railway.
4. Run migrations:

```bash
DATABASE_URL="postgresql+psycopg://postgres:...@db.PROJECT.supabase.co:5432/postgres" alembic upgrade head
```

The migration creates `vector` and Row-Level Security policies for workspace-scoped tables.

## Railway Backend

Start command:

```bash
uvicorn aegisure_backend.main:app --app-dir apps/backend/src --host 0.0.0.0 --port $PORT
```

Required env:

```bash
DATABASE_URL=
SUPABASE_JWT_SECRET=
AEGISURE_GITHUB_APP_ID=
AEGISURE_GITHUB_APP_PRIVATE_KEY_PATH=
AEGISURE_GITHUB_WEBHOOK_SECRET=
AEGISURE_CORS_ORIGINS=https://your-vercel-domain.vercel.app
```

Optional env:

```bash
AEGISURE_ANTHROPIC_API_KEY=
AEGISURE_OPENAI_API_KEY=
AEGISURE_PROVIDED_DAILY_CAP_USD=0.25
AEGISURE_ENABLE_SECOND_OPINION=false
SENTRY_DSN=
```

## Vercel Web Dashboard

Project root: `apps/web`

Required env:

```bash
NEXT_PUBLIC_AEGISURE_BACKEND_URL=https://your-railway-backend
AEGISURE_BACKEND_URL=https://your-railway-backend
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Optional env:

```bash
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## GitHub App

Required permissions:

- Checks: read/write
- Pull requests: read
- Issues: read/write
- Contents: read
- Metadata: read

Webhook events:

- Pull request

Webhook URL:

```text
https://your-railway-backend/github/webhook
```

## PyPI

Do not publish from CI. See [PUBLISH.md](PUBLISH.md).
