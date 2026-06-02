import { AppShell, Badge, Card, EmptyState, PageHeader, StatCard } from "../../components/ui";
import { backendGet, type LedgerResponse } from "../../lib/api";

export default async function ProvenancePage() {
  const data = await backendGet<LedgerResponse>("/provenance", { records: [] });
  const knownAgents = new Set(data.records.map((record) => String(record.agent || "unknown")));
  return (
    <AppShell current="provenance">
      <PageHeader eyebrow="Provenance" title="Agent → prompt → diff → decision.">
        Trace how a change moved through an agent, prompt, diff, policy decision, and human review.
      </PageHeader>
      <div className="space-y-6 p-6 md:p-10">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Recorded changes" value={data.records.length} />
          <StatCard label="Known agents" value={knownAgents.size} tone={knownAgents.size ? "good" : "neutral"} />
          <StatCard label="Storage" value="Workspace-scoped" tone="good" />
        </div>
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Badge tone={data.records.length ? "good" : "neutral"}>{data.records.length ? "Live trail" : "No records yet"}</Badge>
              <h2 className="mt-3 text-lg font-semibold tracking-tight">Provenance timeline</h2>
            </div>
            <Badge>Immutable trail</Badge>
          </div>
          {data.records.length === 0 ? (
            <EmptyState
              title="No live provenance records yet"
              description="Commit through the CLI or process a GitHub PR webhook to populate the timeline with agent, prompt, diff, and decision context."
              actionHref="/onboarding"
              actionLabel="Connect a repo"
            />
          ) : (
            <div className="mt-6 space-y-3">
              {data.records.map((record, index) => (
                <div key={String(record.change_id || index)} className="rounded-xl border border-border/70 bg-muted/25 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="good">{String(record.agent || "unknown agent")}</Badge>
                    <span className="text-xs text-muted-foreground">recorded</span>
                    <Badge>{String(record.commit_sha || "PR diff")}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-foreground">{String(record.prompt_excerpt || record.source || "Change captured without a prompt excerpt.")}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
