# VERIFY

## A. PROVEN

Implemented and tested locally without external credentials:

1. Clean launch repo exists at `Aegisure/` with only runtime/build/test files for the GitHub-first product.
2. Python package lives at `packages/aegisure`, builds to wheel and sdist, and exposes the installed `aegisure` CLI.
3. CLI help works from:
   - root editable install: `pip install -e . && aegisure --help`
   - editable install: `aegisure --help`
   - wheel install in a fresh venv: `/tmp/aegisure-wheel-test/bin/aegisure --help`
4. Static scanner is fully LLM-free:
   - secret detection
   - destructive shell detection
   - diff parser
   - risk scorer
   - policy evaluation
   - Constitution generation
   - cross-agent memory export
   - provenance + attribution
5. GitHub App PR flow is implemented and covered with a fake GitHub client:
   - installation token request
   - PR diff fetch
   - static risk analysis
   - Check Run payload
   - one idempotent PR comment
   - repair prompt in comment
6. Backend is implemented with FastAPI:
   - `/health` public
   - protected dashboard/API routes require auth
   - `/github/webhook` verifies HMAC signatures
   - waitlist and pledge require auth and record intent without charging
7. Dashboard builds successfully and reads live backend endpoints instead of sample risk/provenance/attribution data.
8. Tests:
   - `pytest`: 35 passed
   - `pnpm web:test`: 6 passed across 4 files
   - `pnpm web:build`: passed
   - `python -m build packages/aegisure`: passed
   - fresh venv wheel install + `aegisure --help`: passed
9. Restored launch-product test parity from the source repo:
   - Old Aegisure pivot/backend product tests restored or ported: 9 files.
   - Old Aegisure web product tests restored or ported: 3 files.
   - Dropped desktop/consumer-only tests remain excluded intentionally.
10. `python -m build packages/aegisure` produced:
   - `packages/aegisure/dist/aegisure-0.1.0.tar.gz`
   - `packages/aegisure/dist/aegisure-0.1.0-py3-none-any.whl`

## B. NEEDS REAL CREDENTIALS

These are implemented but require real external credentials or hosted services before live real-user testing:

### Supabase Auth + Postgres

Required vars:

```bash
DATABASE_URL=postgresql+psycopg://postgres:...@db.YOUR_PROJECT.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...
SUPABASE_JWT_AUDIENCE=authenticated
```

Verification once set:

```bash
alembic upgrade head
pnpm web:dev
uvicorn aegisure_backend.main:app --app-dir apps/backend/src --reload
```

Then use `/auth` and sign in with GitHub through Supabase.

### GitHub App

Required vars:

```bash
AEGISURE_GITHUB_APP_ID=...
AEGISURE_GITHUB_APP_PRIVATE_KEY_PATH=/secure/path/private-key.pem
AEGISURE_GITHUB_WEBHOOK_SECRET=...
```

Required GitHub App permissions:

- Checks: read/write
- Pull requests: read
- Issues: read/write
- Contents: read
- Metadata: read

### Optional LLM Reasoning

Static analysis works with these unset.

```bash
AEGISURE_ANTHROPIC_API_KEY=
AEGISURE_OPENAI_API_KEY=
AEGISURE_ANTHROPIC_REVIEW_MODEL=claude-3-5-haiku-latest
AEGISURE_OPENAI_REVIEW_MODEL=gpt-4.1-mini
AEGISURE_PROVIDED_DAILY_CAP_USD=0.25
AEGISURE_ENABLE_SECOND_OPINION=true
```

BYOK is available through `/settings/llm-key` and stores encrypted keys.

### Deployment

Railway backend:

```bash
DATABASE_URL=
SUPABASE_JWT_SECRET=
AEGISURE_GITHUB_APP_ID=
AEGISURE_GITHUB_APP_PRIVATE_KEY_PATH=
AEGISURE_GITHUB_WEBHOOK_SECRET=
AEGISURE_CORS_ORIGINS=https://your-vercel-domain
```

Vercel web:

```bash
NEXT_PUBLIC_AEGISURE_BACKEND_URL=https://your-railway-backend
AEGISURE_BACKEND_URL=https://your-railway-backend
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## C. GAPS

1. Test coverage regression was found and fixed before push.

The first clean-repo migration only had `pytest: 7 passed` and `pnpm web:test: 1 passed` because I had copied a small smoke set instead of the old Aegisure pivot/product test files. That was a missing-tests problem, not a hidden pytest collection issue. I restored the old product-scope pivot tests and web dashboard tests, adapted imports/layout where needed, and confirmed:

```bash
pytest
# 35 passed

pnpm web:test
# 6 passed
```

The true launch-product parity target is lower than the source repo's full 262-ish count because the old count included retired Mac desktop companion tests, native/voice/desktop shell tests, local model setup, mobile/ambient adapters, and consumer Mac-download/licensing tests that are explicitly excluded from the GitHub-first Aegisure repo.

2. I could not run `alembic upgrade head` against a fresh Postgres in this local session because Docker Desktop is not running:

```text
Cannot connect to the Docker daemon at unix:///Users/hetulpatel/.docker/run/docker.sock
```

The migration files are present and target Postgres/pgvector; run them once Docker or Supabase is available.

3. The live GitHub App was not tested against GitHub because real GitHub App credentials were not provided in this session. The flow is tested end to end with a fake GitHub client and will use the real GitHub API once env vars are set.

4. Supabase login was not tested against a live Supabase project because real Supabase keys were not provided. The frontend and backend wiring is present; hosted verification requires the listed env vars.

5. LLM second opinion was not live-tested because Anthropic/OpenAI keys were not provided. Static second opinion and graceful unavailable states work without keys.

## REAL-USER TEST RUNBOOK

1. Push this repo to your empty GitHub repo:

```bash
cd /Users/hetulpatel/Aegisure
git remote add origin https://github.com/Hetul803/Aegisure.git
git add .
git commit -m "Initial Aegisure launch repo"
git branch -M main
git push -u origin main
```

2. Create a Supabase project.

3. Enable GitHub provider in Supabase Auth.

4. Copy values into `.env` from `.env.example`:

```bash
DATABASE_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_JWT_SECRET=...
```

5. Run migrations:

```bash
alembic upgrade head
```

6. Create a GitHub App with the permissions listed above.

7. Save the private key outside the repo and set:

```bash
AEGISURE_GITHUB_APP_ID=...
AEGISURE_GITHUB_APP_PRIVATE_KEY_PATH=/secure/path/github-app-private-key.pem
AEGISURE_GITHUB_WEBHOOK_SECRET=...
```

8. Start the backend:

```bash
uvicorn aegisure_backend.main:app --app-dir apps/backend/src --reload
```

9. Start the web dashboard:

```bash
pnpm web:dev
```

10. Create a smee.io channel and forward GitHub webhooks:

```bash
npx smee-client --url https://smee.io/YOUR_CHANNEL --target http://127.0.0.1:8000/github/webhook
```

11. Open [http://localhost:3000/auth](http://localhost:3000/auth), sign in with GitHub through Supabase, and open the dashboard.

12. Install the GitHub App on a test repo.

13. Open a deliberately risky PR:

```bash
echo 'OPENAI_API_KEY="sk-proj-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"' >> app.py
git checkout -b aegisure-risk-test
git add app.py
git commit -m "test risky AI diff"
git push -u origin aegisure-risk-test
```

14. Confirm on the PR:

- Aegisure Check Run appears.
- Aegisure posts one PR comment.
- The comment includes risk score, severity findings, secret warning, risky files, and repair prompt.

15. Confirm dashboard:

- Risk Report shows the PR.
- Repos list contains the repo.
- Attribution page shows touched files.
- Audit page shows the analysis event.

16. Run a real second opinion:

```bash
export AEGISURE_ANTHROPIC_API_KEY=...
export AEGISURE_ENABLE_SECOND_OPINION=true
```

Synchronize the PR again and confirm the PR comment includes the cross-model section.
