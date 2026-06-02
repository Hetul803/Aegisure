import { AppShell, Badge, Card, EmptyState, PageHeader, StatCard } from "../../components/ui";
import { backendGet, type AuditResponse } from "../../lib/api";

export default async function AuditPage() {
  const data = await backendGet<AuditResponse>("/audit", { events: [] });
  return (
    <AppShell current="audit">
      <PageHeader eyebrow="Audit" title="Every approval, block, repair, and export.">
        Ask grounded questions over your workspace history, then trace the exact underlying records.
      </PageHeader>
      <div className="space-y-6 p-6 md:p-10">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Audit events" value={data.events.length} />
          <StatCard label="Grounding" value="Workspace only" tone="good" />
          <StatCard label="LLM mode" value="Capped or BYOK" />
        </div>
        <Card>
          {data.events.length === 0 ? (
            <EmptyState
              title="No live audit events yet"
              description="Aegisure records approvals, blocks, repair prompts, exports, and GitHub App decisions after your first PR or CLI run."
              actionHref="/onboarding"
              actionLabel="Connect GitHub"
            />
          ) : (
            <div className="space-y-3">
              {data.events.map((event) => (
                <div key={event.id || event.created_at} className="rounded-xl border border-border/70 bg-muted/25 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge>{event.event_type || "event"}</Badge>
                    <span className="text-xs text-muted-foreground">{event.created_at}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{event.message}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <Badge>Audit chatbot</Badge>
          <h2 className="mt-3 text-lg font-semibold tracking-tight">Ask grounded questions over your audit data</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Examples: “what did Codex change today?”, “which agent touched auth this week?”, “show risky PRs still open.” Answers are grounded only in your workspace records and follow LLM caps/BYOK settings.</p>
          <div className="mt-5 rounded-xl border border-border bg-background/70 p-4 text-sm text-muted-foreground">
            Connect a repository to activate workspace-grounded answers. General chatbot behavior is intentionally disabled.
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
