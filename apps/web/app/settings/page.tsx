import { ByokForm } from "../../components/byok-form";
import { AppShell, Badge, Card, PageHeader, StatCard } from "../../components/ui";
import { backendGet, type SettingsResponse } from "../../lib/api";

export default async function SettingsPage() {
  const settings = await backendGet<SettingsResponse>("/settings/llm", {});
  return (
    <AppShell current="settings">
      <PageHeader eyebrow="Settings" title="Workspace, GitHub connection, and model keys.">
        Configure provider keys, hosted caps, GitHub connections, and observability without exposing secrets in source.
      </PageHeader>
      <div className="space-y-6 p-6 md:p-10">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Provided cap used" value={`$${settings.cap_status?.used_usd ?? 0}`} tone={settings.cap_status?.reached ? "warn" : "good"} />
          <StatCard label="Daily allowance" value={`$${settings.cap_status?.cap_usd ?? 0}`} />
          <StatCard label="Providers" value={settings.providers?.length ?? 0} />
        </div>
        <Card>
          <Badge tone={settings.cap_status?.reached ? "warn" : "good"}>LLM cap</Badge>
          <h2 className="mt-3 text-lg font-semibold tracking-tight">Provided reasoning allowance</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Used ${settings.cap_status?.used_usd ?? 0} of ${settings.cap_status?.cap_usd ?? 0} today. Static analysis keeps working after the cap. BYOK calls are uncapped and run on the user's account.</p>
        </Card>
        <ByokForm />
        <div className="grid gap-4 md:grid-cols-2">
          {["GitHub App installation", "Sentry", "PostHog", "Workspace members"].map((item) => (
            <Card key={item}>
              <Badge>env-gated</Badge>
              <h2 className="mt-3 text-lg font-semibold tracking-tight">{item}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Configure when ready; no secrets are hardcoded and every hosted value is documented in DEPLOY.md.</p>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
