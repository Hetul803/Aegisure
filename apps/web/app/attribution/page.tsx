import { History } from "lucide-react";
import { AppShell, Badge, Card, EmptyState, PageHeader } from "../../components/ui";
import { backendGet, type LedgerResponse } from "../../lib/api";

export default async function AttributionPage() {
  const data = await backendGet<LedgerResponse>("/attribution", { records: [] });
  return (
    <AppShell current="attribution">
      <PageHeader eyebrow="Attribution" title="Show everything each agent touched.">
        Filter the ledger by agent, repository, path, and date once live PR and CLI commit records arrive.
      </PageHeader>
      <div className="p-4 md:p-6 lg:p-10">
        {data.records.length === 0 ? (
          <EmptyState title="No attribution records yet." detail="Use `aegisure commit --agent ...` or open a PR through the GitHub App. Aegisure will record which agent touched which files." />
        ) : (
          <Card>
            <div className="divide-y divide-border">
              {data.records.map((record, index) => (
                <div key={String(record.change_id || index)} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-md bg-accent/10 text-accent">
                      <History className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{String(record.agent || "unknown")} touched {String(record.path || "unknown file")}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{String(record.repo || "unknown repo")} · {String(record.created_at || "")}</p>
                    </div>
                  </div>
                  <Badge>{String(record.source || "recorded")}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
