import { AppShell, Badge, Card, PageHeader, SectionHeader, StatCard } from "../../components/ui";
import { backendGet, type PoliciesResponse } from "../../lib/api";

export default async function PoliciesPage() {
  const data = await backendGet<PoliciesResponse>("/policies", { policies: [], default_policy_yaml: "" });
  return (
    <AppShell current="policies">
      <PageHeader eyebrow="Policy as code" title="Write rules every coding agent must obey.">
        Policies decide what comments, requires review, or blocks before a PR reaches merge.
      </PageHeader>
      <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_360px] md:p-10">
        <Card>
          <SectionHeader eyebrow="Workspace policy" title="YAML rules" description="Keep rules specific enough to avoid noisy findings. Only critical violations block by default." />
          <textarea
            className="mt-5 min-h-[460px] w-full resize-y rounded-xl border border-border bg-background/75 p-4 font-mono text-sm leading-6 text-foreground outline-none ring-ring/0 transition focus:ring-2"
            defaultValue={data.default_policy_yaml || "rules:\n  - id: require-review-payments\n    match: payments/**\n    severity: critical\n    action: require_human_review"}
            aria-label="Workspace policy YAML"
          />
        </Card>
        <div className="space-y-4">
          <StatCard label="Saved policies" value={data.policies.length} />
          <Card>
            <Badge tone="warn">Live evaluation</Badge>
            <h2 className="mt-3 text-lg font-semibold tracking-tight">Before you save</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Paste a sample diff to see pass, require review, or block before the policy becomes active.</p>
          </Card>
          <Card>
            <Badge>Default threshold</Badge>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Critical findings can block. High findings are prominent. Warning and info are quiet and dismissible.</p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
