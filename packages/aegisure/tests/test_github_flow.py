from __future__ import annotations

import asyncio

from aegisure_github.models import GitHubRepository, GitHubPullRequest, GitHubWebhookEvent
from aegisure_github.pr_flow import COMMENT_MARKER, process_pull_request_webhook


class FakeGitHubClient:
    def __init__(self) -> None:
        self.check_runs: list[dict] = []
        self.comments: list[dict] = []

    async def create_installation_token(self, installation_id: int) -> str:
        assert installation_id == 42
        return "installation-token"

    async def fetch_pull_request_diff(self, *, owner: str, repo: str, number: int, installation_token: str) -> str:
        assert (owner, repo, number, installation_token) == ("acme", "demo", 7, "installation-token")
        return """diff --git a/app.py b/app.py
index 1111111..2222222 100644
--- a/app.py
+++ b/app.py
@@ -1 +1,2 @@
 print("safe")
+OPENAI_API_KEY="sk-proj-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
"""

    async def create_check_run(self, *, owner: str, repo: str, check_run, installation_token: str) -> dict:
        payload = check_run.request_payload()
        self.check_runs.append(payload)
        return {"id": 100, **payload}

    async def list_pr_comments(self, *, owner: str, repo: str, number: int, installation_token: str) -> list[dict]:
        return self.comments

    async def post_pr_comment(self, *, owner: str, repo: str, number: int, body: str, installation_token: str) -> dict:
        comment = {"id": 200, "body": body}
        self.comments.append(comment)
        return comment

    async def update_pr_comment(self, *, owner: str, repo: str, comment_id: int, body: str, installation_token: str) -> dict:
        self.comments[0] = {"id": comment_id, "body": body}
        return self.comments[0]


def test_webhook_to_check_run_and_single_comment_end_to_end() -> None:
    asyncio.run(_run_flow())


async def _run_flow() -> None:
    client = FakeGitHubClient()
    event = GitHubWebhookEvent(
        delivery_id="delivery-1",
        event="pull_request",
        action="opened",
        installation_id=42,
        repository=GitHubRepository(github_id=1, owner="acme", name="demo", full_name="acme/demo"),
        pull_request=GitHubPullRequest(github_id=77, number=7, title="Risky PR", state="open", head_sha="abc123"),
    )
    result = await process_pull_request_webhook(event, client=client)
    assert result.processed is True
    assert result.risk_report["verdict"] == "block"
    assert client.check_runs[0]["conclusion"] == "failure"
    assert len(client.comments) == 1
    assert COMMENT_MARKER in client.comments[0]["body"]
    assert "Request fix prompt" in client.comments[0]["body"]

    await process_pull_request_webhook(event, client=client)
    assert len(client.comments) == 1
