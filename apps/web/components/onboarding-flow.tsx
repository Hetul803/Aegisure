"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Github, GitPullRequestArrow, LayoutDashboard, ScrollText } from "lucide-react";

const steps = [
  {
    title: "Sign in with GitHub",
    detail: "Create your workspace through Supabase Auth so reports, policies, and audit events stay scoped to you.",
    icon: Github,
  },
  {
    title: "Install the GitHub App",
    detail: "Give Aegisure read access to pull requests and write access to checks/comments for selected repositories.",
    icon: GitPullRequestArrow,
  },
  {
    title: "Pick repositories",
    detail: "Start with one active repo. Empty states stay quiet until live PR data arrives.",
    icon: CheckCircle2,
  },
  {
    title: "Generate Aegisure.md",
    detail: "Aegisure creates the first Constitution and exports aligned agent memory files.",
    icon: ScrollText,
  },
  {
    title: "Land on dashboard",
    detail: "Open the first Risk Report, copy a repair prompt, or ask the audit chatbot over real workspace records.",
    icon: LayoutDashboard,
  },
];

export function OnboardingFlow() {
  const [active, setActive] = useState(0);

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const selected = index === active;
          return (
            <button
              key={step.title}
              onClick={() => setActive(index)}
              className={`smooth-pop w-full rounded-lg border p-4 text-left ${selected ? "border-accent bg-accent/10" : "border-border bg-card hover:bg-muted/60"}`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">{step.title}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{step.detail}</p>
            </button>
          );
        })}
      </div>
      <section className="hairline rounded-lg bg-card/82 p-6 shadow-sm">
        {(() => {
          const step = steps[active];
          const Icon = step.icon;
          return (
            <>
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-accent/12 text-accent">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-6 text-sm text-muted-foreground">Step {active + 1} of {steps.length}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">{step.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{step.detail}</p>
              <div className="mt-8 rounded-md border border-border bg-background p-4">
                <p className="text-sm font-medium">What happens next</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {active === 0 && "Use the auth page to start the GitHub OAuth flow. After login, Aegisure attaches or creates your workspace."}
                  {active === 1 && "Set your GitHub App webhook to the Railway backend. Aegisure will verify signatures and avoid duplicate deliveries."}
                  {active === 2 && "Install on a single repo first. When a PR opens, Aegisure creates the first live risk report."}
                  {active === 3 && "Run `aegisure init` locally or generate from the dashboard when repo context is available."}
                  {active === 4 && "The dashboard stays empty until live backend records arrive, then shows reports, attribution, provenance, and audit data."}
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={active === 0 ? "/auth" : active === 4 ? "/dashboard" : "/repos"} className="smooth-pop inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent/90">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </a>
                <button onClick={() => setActive(Math.min(active + 1, steps.length - 1))} className="smooth-pop h-10 rounded-md border border-border bg-card px-4 text-sm font-medium hover:bg-muted">
                  Preview next step
                </button>
              </div>
            </>
          );
        })()}
      </section>
    </div>
  );
}
