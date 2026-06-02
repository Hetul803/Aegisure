# DECISIONS

## Clean Launch Repo

- Created this repository as a new local git repo at `Aegisure/` and copied only the GitHub-first launch product from the old AURA desktop-companion repo.
- Kept runtime code under:
  - `apps/backend` for FastAPI, dashboard API, auth, GitHub webhook, and hosted data.
  - `apps/web` for the Next.js dashboard.
  - `packages/aegisure` for the installable Python package and CLI.
  - `migrations` for Alembic/Postgres/Supabase schema.
- Excluded legacy consumer-desktop code: Electron shell, voice/speech/native macOS helpers, mobile/ambient/home/car adapters, OS automation, Mac packaging/notarization, generated artifacts, desktop tests, and old AURA marketing material. Those belong in the old repo history, not the launch repo.
- Excluded old top-level items and reasons:
  - `apps/desktop`: Electron desktop companion, overlay, native helpers, release assets, and desktop tests are outside the GitHub-first product.
  - `apps/backend/.venv`, `.pytest_cache`, fixtures tied to the desktop product: generated/local-only or legacy test data.
  - `apps/web/.next`, `apps/web/node_modules`, `apps/desktop/node_modules`, `apps/desktop/release`, `apps/desktop/dist*`: build artifacts and vendored dependencies.
  - `packages/shared`: desktop/shared UI-era package not required by the GitHub App, CLI, or dashboard.
  - `scripts` for Mac packaging, license generation, notarization, clean-Mac QA, desktop reset, and desktop alpha checks: consumer-desktop launch tooling, not Phase 1 developer-tool runtime.
  - `start-aura.sh`, `start-aura.ps1`, `start-aegisure.sh`: desktop/dev-launch scripts from the old app.
  - `docs` and `config` that described the Mac companion, app signing, licensing, voice, local-model setup, or consumer launch: not relevant to the pivot launch repo.
  - `test_runs`: generated run artifacts.

## Package Layout

- `packages/aegisure` is the PyPI packaging root. The importable packages are `aegisure` and `aegisure_github` under `packages/aegisure/src`.
- The root `pyproject.toml` is for monorepo test/tool config only. Package publication uses `packages/aegisure/pyproject.toml`.
- Console command: `aegisure`.

## Compatibility

- User-facing product/company name is Aegisure.
- Canonical Constitution file is `AEGIS.md`.
- External agent files keep their real filenames: `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.clinerules`, and `.github/copilot-instructions.md`.
- The provenance trailer keys remain `AURA-Agent`, `AURA-Prompt-SHA256`, and `AURA-Prompt` so pre-rebrand commits are still readable. The git note namespace also remains `aura/provenance` for compatibility.
- New local sidecar files use `.aegisure/`.

## Static Core Versus LLM

- Diff parsing, risk scoring, secret detection, shell-risk classification, policy evaluation, Constitution generation, export, provenance, attribution, and CLI scan are fully LLM-free.
- LLM features are opt-in: cross-model second opinion, natural-language audit answer phrasing, and richer review explanations.
- LLM keys are read from environment or encrypted BYOK storage. No key is hardcoded.
- Provided-mode calls are capped with `AEGISURE_PROVIDED_DAILY_CAP_USD`; static analysis continues after the cap is reached.

## Auth And Data

- Dashboard auth uses Supabase GitHub login. The frontend stores the Supabase session token in a cookie for server-side backend fetches.
- Backend accepts a static `AEGISURE_API_TOKEN` for local/dev automation and Supabase JWTs for hosted usage.
- Every backend endpoint requires auth except `/health` and `/github/webhook`. Waitlist and founding pledge are authenticated intent records in this app; a future public marketing site can proxy them through a minimal public lead-capture service if needed.
- Data rows are workspace-scoped in the application and RLS policies are included in migrations for hosted Supabase Postgres.

## GitHub App

- Webhook path is real: HMAC verification, delivery idempotency, installation token, PR diff fetch, static analysis, policy evaluation, Check Run, idempotent PR comment, repair prompt, attribution capture, and persistence.
- Local webhook testing should use smee.io or another GitHub webhook tunnel; no fake webhook claims are made.

## Monetization

- This launch repo intentionally does not charge money. Waitlist and founding pledge endpoints record intent only.
- No Stripe live keys or payment processing are present.

## Publish Commands

Do not publish from automation. The founder should run:

```bash
cd packages/aegisure
python -m build
python -m twine upload dist/*
```

For TestPyPI rehearsal:

```bash
python -m twine upload --repository testpypi dist/*
```

## 2026-06-02 UI And Deploy Polish

- Upgraded the web dashboard with the existing Next.js, Tailwind, shadcn-style local primitives, and `lucide-react`. No heavy UI dependency was added because the product only needed a cohesive design system, not another component framework.
- Implemented dark/light theming through CSS variables and a small localStorage-backed toggle. Dark is the default because the product is a code-review/control plane, but light mode remains usable.
- Kept live backend data wiring intact on dashboard pages. Empty states explain the next setup step instead of showing sample records.
- Supabase deployment uses the classic JWT-style env names: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_JWT_SECRET`. The codebase intentionally does not mix in the newer `sb_publishable_` / `sb_secret_` naming.
- Railway is configured from the repo root with `requirements.txt`, `runtime.txt`, and `Procfile`. The GitHub App private key should be stored as `AEGISURE_GITHUB_APP_PRIVATE_KEY` in hosted env; `AEGISURE_GITHUB_APP_PRIVATE_KEY_PATH` remains a local-development fallback.
- Vercel is configured from the repo root with `vercel.json` because the pnpm workspace lockfile is root-level. The config builds the `aegisure-web` package and outputs `apps/web/.next`.
- The launch migration now creates runtime repo/PR status columns and uses a real Postgres `vector(1536)` column for memory timeline embeddings. SQLite remains the CLI/local path and does not need pgvector.
