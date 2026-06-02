import { AlertTriangle, Copy, GitPullRequestArrow } from "lucide-react";
import { AppShell, Badge, Button, Card, EmptyState, PageHeader, SectionHeader, StatCard } from "../../components/ui";
import { backendGet, type RiskReportsResponse } from "../../lib/api";

function toneForVerdict(verdict?: string): "neutral" | "good" | "warn" | "bad" {
  if (verdict === "block") return "bad";
  if (verdict === "require_review" || verdict === "caution") return "warn";
  if (verdict === "pass") return "good";
  return "neutral";
}

export default async function DashboardPage() {
  const data = await backendGet<RiskReportsResponse>("/risk-reports", { reports: [] });
  const latest = data.reports[0];
  const findings = (latest?.findings || []) as Array<{ category?: string; severity?: string; path?: string; explanation?: string }>;
  return (
    <AppShell current="dashboard">
      <PageHeader
        eyebrow="Risk Reports"
        title="Know when an agent-generated PR is safe to merge."
        action={<Button href="/onboarding">Connect GitHub App</Button>}
      >
        Aegisure turns every AI-generated diff into a plain-English decision, with findings, policy violations, attribution, and a repair prompt.
      </PageHeader>
      <div className="space-y-8 p-4 md:p-6 lg:p-10">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Latest verdict" value={latest?.verdict || "None"} detail="Only critical findings block by default." tone={toneForVerdict(latest?.verdict)} />
          <StatCard label="Risk score" value={latest?.score ?? 0} detail="Static score from LLM-free analysis." tone={(latest?.score || 0) > 80 ? "bad" : (latest?.score || 0) > 40 ? "warn" : "good"} />
          <StatCard label="Findings" value={findings.length} detail="Severity-tiered and dismissible in product flow." />
        </div>

        {latest ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <Card>
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <Badge tone={toneForVerdict(latest.verdict)}>{latest.verdict}</Badge>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight">{latest.summary}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">This report was loaded from the backend. No sample reports are shown.</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-4 text-center">
                  <div className="text-4xl font-semibold tracking-tight">{latest.score ?? 0}</div>
                  <div className="mt-1 text-xs text-muted-foreground">risk score</div>
                </div>
              </div>
              <SectionHeader title="Findings" detail="Grouped by severity so reviewers can focus quickly." />
              <div className="mt-4 space-y-3">
                {findings.length === 0 ? (
                  <p className="rounded-md border border-border bg-background p-4 text-sm text-muted-foreground">No findings in this report.</p>
                ) : findings.map((finding, index) => (
                  <div key={`${finding.category}-${index}`} className="rounded-md border border-border bg-background p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={finding.severity === "critical" ? "bad" : finding.severity === "high" ? "warn" : "neutral"}>{finding.severity || "info"}</Badge>
                      <span className="text-sm font-medium">{finding.category}</span>
                      <span className="text-xs text-muted-foreground">{finding.path}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{finding.explanation}</p>
                  </div>
                ))}
              </div>
            </Card>
            <div className="space-y-6">
              <Card>
                <Badge tone="accent">Repair prompt</Badge>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">The PR comment includes a constrained prompt that tells the agent what to fix, what not to touch, and which tests to run.</p>
                <Button variant="secondary" className="mt-4">
                  <Copy className="h-4 w-4" />
                  Copy from PR
                </Button>
              </Card>
              <Card>
                <Badge>Second opinion</Badge>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">Appears when enabled and an Anthropic/OpenAI/Ollama reviewer is configured.</p>
              </Card>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No live risk reports yet."
            detail="Connect the GitHub App, open or synchronize a pull request, and Aegisure will post a check run and show the live report here."
            action={<Button href="/onboarding"><GitPullRequestArrow className="h-4 w-4" /> Start onboarding</Button>}
          />
        )}

        <Card>
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-4 w-4 text-warning" />
            <p className="text-sm leading-6 text-muted-foreground">Static analysis always runs without API keys. LLM reasoning features are opt-in and subject to caps or BYOK settings.</p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
