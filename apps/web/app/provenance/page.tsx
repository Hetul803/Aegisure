import { AppShell, Badge, Card, PageHeader } from "../../components/ui";
import { backendGet, type LedgerResponse } from "../../lib/api";

export default async function ProvenancePage() {
  const data = await backendGet<LedgerResponse>("/provenance", { records: [] });
  return (
    <AppShell>
      <PageHeader eyebrow="Provenance" title="Agent → prompt → diff → decision." />
      <div className="p-6 md:p-10">
        <Card>
          <Badge tone={data.records.length ? "good" : "neutral"}>{data.records.length ? "Live trail" : "No records yet"}</Badge>
          {data.records.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">No live provenance records yet. Commit through the CLI or process a PR webhook to populate this timeline.</p>
          ) : (
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              {data.records.map((record, index) => (
                <p key={String(record.change_id || index)}>{String(record.agent || "unknown agent")} → {String(record.prompt_excerpt || record.source || "change")} → {String(record.commit_sha || "PR diff")}</p>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
