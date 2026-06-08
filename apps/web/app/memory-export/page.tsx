import { Download, FileText } from "lucide-react";
import { AppShell, Badge, Button, Card, PageHeader } from "../../components/ui";
import { agentExports } from "../../lib/data";

export default function MemoryExportPage() {
  return (
    <AppShell current="memory">
      <PageHeader eyebrow="Cross-agent memory" title="One Constitution, every agent aligned." action={<Button variant="secondary"><Download className="h-4 w-4" /> Export all</Button>}>
        Aegisure.md is the canonical source. Aegisure exports idempotent rule files for real coding agents without rewriting your project logic.
      </PageHeader>
      <div className="grid gap-4 p-4 md:grid-cols-2 md:p-6 lg:grid-cols-3 lg:p-10">
        {agentExports.map((target) => (
          <Card key={target}>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent/10 text-accent">
              <FileText className="h-4 w-4" />
            </div>
            <div className="mt-5"><Badge tone={target === "Aegisure.md" ? "accent" : "neutral"}>{target === "Aegisure.md" ? "Canonical" : "Export"}</Badge></div>
            <h2 className="mt-4 font-medium">{target}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {target === "Aegisure.md" ? "Canonical Aegisure Constitution." : "Generated from Aegisure.md so external agents receive the same rules."}
            </p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
