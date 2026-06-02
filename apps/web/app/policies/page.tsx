import { AppShell, Badge, Card, PageHeader } from "../../components/ui";
import { backendGet, type PoliciesResponse } from "../../lib/api";

export default async function PoliciesPage() {
  const data = await backendGet<PoliciesResponse>("/policies", { policies: [], default_policy_yaml: "" });
  return (
    <AppShell>
      <PageHeader eyebrow="Policy as code" title="Write rules that every agent must obey." />
      <div className="grid gap-6 p-6 md:grid-cols-[1fr_340px] md:p-10">
        <Card>
          <textarea className="min-h-[420px] w-full rounded-md border border-white/10 bg-black p-4 font-mono text-sm outline-none" defaultValue={data.default_policy_yaml || "rules: []"} />
        </Card>
        <Card>
          <Badge tone="warn">Live evaluation</Badge>
          <p className="mt-3 text-sm text-muted-foreground">Paste a sample diff to see pass, require review, or block before saving.</p>
          <p className="mt-3 text-sm text-muted-foreground">{data.policies.length} saved workspace policies.</p>
        </Card>
      </div>
    </AppShell>
  );
}
