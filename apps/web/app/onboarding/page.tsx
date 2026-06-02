import { AppShell, Button, Card, PageHeader, SectionHeader } from "../../components/ui";
import { OnboardingFlow } from "../../components/onboarding-flow";

export default function OnboardingPage() {
  return (
    <AppShell current="repos">
      <PageHeader
        eyebrow="Onboarding"
        title="Connect one repo and get to the first useful report."
        action={<Button href="/dashboard">Skip to dashboard</Button>}
      >
        The fastest Aegisure aha is simple: connect the GitHub App, open a risky pull request, then see the check run, PR comment, repair prompt, provenance, and dashboard report.
      </PageHeader>
      <div className="space-y-8 p-4 md:p-6 lg:p-10">
        <OnboardingFlow />
        <Card>
          <SectionHeader title="First-run checklist" detail="Everything here uses real product wiring; no sample data is injected." />
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["1", "Set Supabase env", "Enables GitHub OAuth and workspace sessions."],
              ["2", "Set GitHub App env", "Enables verified webhook → PR report flow."],
              ["3", "Open a test PR", "Triggers the first live Risk Report screen."],
            ].map(([num, title, detail]) => (
              <div key={title} className="rounded-md border border-border bg-background p-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-sm font-semibold text-accent">{num}</div>
                <h3 className="mt-4 text-sm font-medium">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
