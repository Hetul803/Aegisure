# Aegisure Demo

## 1. Local Constitution And Export

```bash
cd /path/to/demo-repo
aegisure init
aegisure export
```

Show:

- `AEGIS.md`
- `AGENTS.md`
- `CLAUDE.md`
- `.cursorrules`
- `.clinerules`
- `.github/copilot-instructions.md`

Message: one canonical Constitution becomes cross-vendor memory for every coding agent.

## 2. Static Risk Scan

Create a risky staged diff:

```bash
echo 'OPENAI_API_KEY="sk-proj-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"' >> app.py
git add app.py
aegisure scan --staged
```

Expected: Aegisure blocks the diff using the free static core. No LLM key is required.

## 3. Repair Prompt

```bash
aegisure repair --staged --agent codex
```

Expected: a constrained, ready-to-paste repair prompt that says exactly what to fix and what to preserve.

## 4. Provenance And Attribution

```bash
aegisure commit -m "fix auth guard" --agent codex --prompt "Remove the leaked token and add a regression test"
```

Expected: commit trailers preserve agent/prompt provenance and `.aegisure/attribution-ledger.jsonl` records touched files.

## 5. Dashboard

```bash
export AEGISURE_API_TOKEN=dev-token
uvicorn aegisure_backend.main:app --app-dir apps/backend/src --reload
pnpm web:dev
```

Open [http://localhost:3000](http://localhost:3000) and show:

1. Risk Report hero screen.
2. Repos list.
3. Attribution ledger.
4. Provenance timeline.
5. Policy editor.
6. BYOK/cap status.

## 6. GitHub App Live Flow

Configure:

- `AEGISURE_GITHUB_APP_ID`
- `AEGISURE_GITHUB_APP_PRIVATE_KEY_PATH`
- `AEGISURE_GITHUB_WEBHOOK_SECRET`
- `DATABASE_URL`

Forward GitHub webhooks locally:

```bash
npx smee-client --url https://smee.io/YOUR_CHANNEL --target http://127.0.0.1:8000/github/webhook
```

Open or synchronize a pull request containing a fake key or deleted test file.

Expected:

- HMAC-verified webhook is accepted once.
- Aegisure fetches the PR diff using the installation token.
- Static analysis and policy checks run.
- A Check Run appears.
- One PR comment is posted or updated with the risk summary, severity-tiered findings, and repair prompt.
- Dashboard populates with live report data.
