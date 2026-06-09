# Aegisure Deploy Guide

This repo is a monorepo:

- Frontend: `apps/web` on Vercel
- Backend/API/webhook: `apps/backend` on Railway
- CLI package: `packages/aegisure`, not deployed by Vercel or Railway
- Database/Auth: Supabase Postgres + Supabase Auth

Do not commit real secrets. Put real values only in Vercel, Railway, Supabase, or your local shell.

## 1. Supabase

Supabase provides GitHub login, hosted Postgres, and pgvector.

Aegisure uses the classic Supabase env names:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`

Do not mix these with `sb_publishable_` / `sb_secret_` names unless you migrate the code intentionally.

### Run Migrations

Run from the repo root after replacing placeholders:

```bash
DATABASE_URL="postgresql+psycopg://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" alembic upgrade head
```

The migration includes:

- `CREATE EXTENSION IF NOT EXISTS vector`
- workspace-scoped tables
- RLS enablement and workspace isolation policies

If Supabase reports that `vector` is unavailable, enable the Vector extension in the Supabase dashboard and rerun the command.

## 2. Vercel Frontend

Create/import a Vercel project from this GitHub repo.

Project settings:

```text
Root Directory: apps/web
Framework Preset: Next.js
Install Command: cd ../.. && pnpm install --frozen-lockfile
Build Command: cd ../.. && pnpm --filter aegisure-web build
Output Directory: .next
```

These settings are also encoded in `apps/web/vercel.json`.

Set exactly these Vercel env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[SUPABASE_ANON_KEY]
NEXT_PUBLIC_API_URL=https://[RAILWAY_BACKEND_DOMAIN]
```

Only `NEXT_PUBLIC_*` values belong in Vercel for this launch setup. Do not put GitHub App private keys, Supabase service-role keys, or LLM provider keys in Vercel.

## 3. Railway Backend

Create/import a Railway service from this GitHub repo.

Project settings:

```text
Root Directory: apps/backend
Builder: Nixpacks
Start Command: uvicorn aegisure_backend.main:app --app-dir src --host 0.0.0.0 --port $PORT
```

Railway config is included in:

- `apps/backend/railway.json`
- `apps/backend/Procfile`
- `apps/backend/runtime.txt`
- `apps/backend/requirements.txt`

Set exactly these Railway env vars:

```bash
DATABASE_URL=postgresql+psycopg://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=[SUPABASE_SERVICE_ROLE_KEY]
SUPABASE_JWT_SECRET=[SUPABASE_JWT_SECRET]
AEGISURE_GITHUB_APP_ID=[GITHUB_APP_ID]
AEGISURE_GITHUB_WEBHOOK_SECRET=[GITHUB_WEBHOOK_SECRET]
AEGISURE_GITHUB_APP_PRIVATE_KEY=[PASTE_THE_MULTILINE_PEM_CONTENTS_NOT_A_PATH]
ALLOWED_ORIGINS=https://aegisure.dev
```

Optional Railway env vars:

```bash
AEGISURE_ANTHROPIC_API_KEY=
AEGISURE_OPENAI_API_KEY=
AEGISURE_ENABLE_SECOND_OPINION=false
AEGISURE_ANTHROPIC_REVIEW_MODEL=claude-3-5-haiku-latest
AEGISURE_OPENAI_REVIEW_MODEL=gpt-4.1-mini
AEGISURE_PROVIDED_DAILY_CAP_USD=0.25
SENTRY_DSN=
```

Railway provides `PORT` automatically.

## 4. GitHub App

Required permissions:

- Checks: read/write
- Pull requests: read
- Issues: read/write
- Contents: read
- Metadata: read

Webhook events:

- Pull request

## 5. Post-Deploy Wiring

After Vercel and Railway deploy successfully, update these three places.

### A. Vercel Backend URL

Set Vercel:

```bash
NEXT_PUBLIC_API_URL=https://<railway-backend>
```

Use the real Railway backend origin. Example with the public domain:

```bash
NEXT_PUBLIC_API_URL=https://api.aegisure.dev
```

No trailing slash is required.

### B. GitHub App Webhook URL

Set the GitHub App webhook URL to:

```text
https://<railway-backend>/github/webhook
```

Example:

```text
https://api.aegisure.dev/github/webhook
```

### C. Supabase Allowed Redirect URLs

Add the Vercel frontend URL to Supabase Auth allowed redirect URLs:

```text
https://aegisure.dev/auth
https://aegisure.dev/onboarding
https://aegisure.dev/dashboard
```

For local development, also allow:

```text
http://localhost:3000/auth
http://localhost:3000/onboarding
http://localhost:3000/dashboard
```

If you use Supabase's GitHub provider, also add the Supabase callback URL shown in the Supabase dashboard to the GitHub OAuth app.

## 6. Local Webhook Test

Use smee.io or another tunnel to forward GitHub webhooks to:

```text
http://127.0.0.1:8000/github/webhook
```

Then temporarily set the GitHub App webhook URL to your tunnel URL.

## 7. PyPI

Do not publish from CI. See [PUBLISH.md](PUBLISH.md).
