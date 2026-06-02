import { AppShell, Badge, Button, Card, PageHeader, SectionHeader } from "../../../../components/ui";

export default function ConstitutionPage() {
  return (
    <AppShell current="repos">
      <PageHeader eyebrow="AEGIS.md" title="Project Constitution editor">
        Edit the canonical rules that become AGENTS.md, CLAUDE.md, Cursor, Cline/Roo, and Copilot memory.
      </PageHeader>
      <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_360px] md:p-10">
        <Card>
          <SectionHeader eyebrow="Canonical memory" title="AEGIS.md" description="Aegisure keeps one source of truth and exports it into the files real coding agents already read." />
          <textarea
            className="mt-5 min-h-[500px] w-full resize-y rounded-xl border border-border bg-background/75 p-4 font-mono text-sm leading-6 text-foreground outline-none ring-ring/0 transition focus:ring-2"
            placeholder="Generate AEGIS.md from a connected repository to edit live project rules here."
            aria-label="AEGIS.md editor"
          />
        </Card>
        <Card>
          <Badge tone="good">Versioned</Badge>
          <h2 className="mt-3 text-lg font-semibold tracking-tight">Constitution health</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Last generated from repo scan. Next step: save and export cross-agent memory files.</p>
          <div className="mt-5 space-y-3 text-sm text-muted-foreground">
            <p className="rounded-xl border border-border bg-muted/25 p-3">Canonical file: AEGIS.md</p>
            <p className="rounded-xl border border-border bg-muted/25 p-3">Exports: AGENTS.md, CLAUDE.md, Cursor, Cline/Roo, Copilot</p>
          </div>
          <Button className="mt-5">Export all formats</Button>
        </Card>
      </div>
    </AppShell>
  );
}
