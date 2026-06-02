import Link from "next/link";
import { ArrowRight, CheckCircle2, Github, ShieldCheck, Terminal } from "lucide-react";
import { Badge, Button, Card } from "../components/ui";
import { ThemeToggle } from "../components/theme-toggle";
import { heroActions } from "../lib/data";

const howItWorks = [
  "Connect a repository through the GitHub App.",
  "Generate AEGIS.md and define what agents must preserve.",
  "Aegisure checks every PR and records attribution/provenance.",
  "You approve, request a repair, or block risky work.",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 md:px-6">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          Aegisure
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#problem" className="hover:text-foreground">Problem</a>
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#features" className="hover:text-foreground">Features</a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button href="/auth" variant="secondary" className="hidden sm:inline-flex">Sign in</Button>
          <Button href="/auth">Get started free</Button>
        </div>
      </header>

      <section className="mx-auto grid min-h-[78vh] max-w-7xl items-center gap-10 px-4 py-16 md:px-6 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <Badge tone="accent">Control plane for AI coding agents</Badge>
          <h1 className="mt-6 max-w-5xl text-5xl font-semibold tracking-tight md:text-7xl">
            The control and audit plane for AI coding agents.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            See, govern, and remember everything every agent does, across vendors. Aegisure gives teams static risk checks, policy enforcement, attribution, provenance, and repair prompts around Codex, Claude Code, Cursor, Copilot, Cline, and Roo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/auth">
              <Github className="h-4 w-4" />
              Sign in with GitHub
            </Button>
            <Button href="#cli" variant="secondary">
              <Terminal className="h-4 w-4" />
              Install the CLI
            </Button>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">No card collection. No live charges. Static analysis runs without LLM keys.</p>
        </div>
        <Card className="p-0">
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between">
              <Badge tone="warn">Risk report</Badge>
              <span className="text-xs text-muted-foreground">PR #128 · auth/session.ts</span>
            </div>
          </div>
          <div className="space-y-4 p-5">
            {[
              ["critical", "Secret-like value added to diff", "Aegisure blocks before merge."],
              ["high", "Auth boundary touched", "Human review required by policy."],
              ["info", "Codex attribution recorded", "Prompt hash and touched files preserved."],
            ].map(([tone, title, detail]) => (
              <div key={title} className="rounded-md border border-border bg-background p-4">
                <Badge tone={tone === "critical" ? "bad" : tone === "high" ? "warn" : "good"}>{tone}</Badge>
                <h3 className="mt-3 text-sm font-medium">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
              </div>
            ))}
            <div className="rounded-md border border-border bg-muted/40 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ready-to-paste repair prompt</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Fix only the secret finding. Do not touch payment or auth policy. Add a regression test and explain residual risk.</p>
            </div>
          </div>
        </Card>
      </section>

      <section id="problem" className="border-y border-border bg-card/35 px-4 py-16 md:px-6">
        <div className="mx-auto max-w-5xl">
          <Badge>Problem</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">Agents ship code faster than humans can review it.</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Teams now use multiple coding agents at once. The work moves quickly, but review context gets scattered: who changed auth, which prompt caused the diff, which rules were violated, and whether another model disagrees.
          </p>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <Badge>How it works</Badge>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {howItWorks.map((item, index) => (
            <Card key={item}>
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 text-accent">{index + 1}</div>
              <p className="mt-5 text-sm leading-6 text-muted-foreground">{item}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge>Features</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">Built for teams already using AI agents.</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">Aegisure is for developers, founders, and engineering teams that want vendor-neutral control without slowing every PR to a crawl.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {heroActions.map((item) => (
            <Card key={item.title}>
              <CheckCircle2 className="h-5 w-5 text-accent" />
              <h3 className="mt-5 font-medium">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="cli" className="mx-auto max-w-7xl px-4 pb-20 md:px-6">
        <Card className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <Badge tone="accent">CLI on-ramp</Badge>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">Start locally before connecting GitHub.</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Generate a Constitution, scan staged diffs, and export agent memory files from your terminal.</p>
          </div>
          <pre className="overflow-x-auto rounded-md border border-border bg-background p-4 text-sm text-muted-foreground"><code>pip install aegisure{"\n"}aegisure init{"\n"}aegisure scan --staged</code></pre>
        </Card>
      </section>

      <footer className="border-t border-border px-4 py-8 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>Aegisure · vendor-neutral oversight for AI coding agents</span>
          <Link href="/auth" className="inline-flex items-center gap-1 font-medium text-foreground">
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </footer>
    </main>
  );
}
