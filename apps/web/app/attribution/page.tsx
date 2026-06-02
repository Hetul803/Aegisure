import { AppShell, Badge, Card, PageHeader } from "../../components/ui";
import { backendGet, type LedgerResponse } from "../../lib/api";

export default async function AttributionPage() {
  const data = await backendGet<LedgerResponse>("/attribution", { records: [] });
  return (
    <AppShell>
      <PageHeader eyebrow="Attribution" title="Show everything each agent touched." />
      <div className="p-6 md:p-10">
        <Card>
          {data.records.length === 0 ? (
            <p className="text-sm text-muted-foreground">No live attribution records yet. Use `aegisure commit --agent ...` or open a PR through the GitHub App.</p>
          ) : (
            <div className="grid gap-3 text-sm">
              {data.records.map((record, index) => (
                <div key={String(record.change_id || index)} className="flex items-center justify-between border-b border-white/10 py-3 last:border-0">
                  <span>{String(record.agent || "unknown")} touched {String(record.path || "unknown file")}</span>
                  <Badge>{String(record.source || "recorded")}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
