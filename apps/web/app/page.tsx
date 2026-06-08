import Link from "next/link";
import { ArrowRight, CheckCircle2, Github, ShieldCheck } from "lucide-react";
import { FauxTerminal } from "../components/faux-terminal";
import { InstallCommand } from "../components/install-command";
import { Badge, Button, Card } from "../components/ui";
import { ThemeToggle } from "../components/theme-toggle";

const howItWorks = [
  ["Connect repo", "Install the GitHub App or start locally with the CLI."],
  ["Define constitution", "Generate Aegisure.md once and export rules to every agent."],
  ["Agents get checked", "Aegisure scans diffs, policies, provenance, and risk."],
  ["You approve", "Block, request repair, require review, or merge with context."],
];

const features = [
  { title: "LLM-free risk blocking", detail: "Secrets, destructive commands, auth, payment, deploy, dependency, and test-removal checks run without API keys." },
  { title: "Cross-agent rule sync", detail: "One Constitution exports clean rule files for Codex, Claude Code, Cursor, Copilot, Cline, and Roo." },
  { title: "Attribution + provenance", detail: "Record which agent touched which files and what prompt produced the change." },
  { title: "Repair prompts", detail: "Generate constrained fix prompts that tell an agent exactly what to repair and what not to touch." },
  { title: "Cross-model second opinion", detail: "Optional LLM review when you want one model to inspect another model's diff." },
  { title: "Policy-as-code", detail: "Keep rules like payments require review or secrets block in versioned YAML." },
  { title: "Audit trail", detail: "Ask grounded questions over your own workspace records, never a general chatbot." },
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
          <Link href="/docs" className="hover:text-foreground">Docs</Link>
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button href="/auth">Sign in with GitHub</Button>
        </div>
      </header>

      <section className="mx-auto grid min-h-[78vh] max-w-7xl items-center gap-10 px-4 py-16 md:px-6 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <Badge tone="accent">Control plane for AI coding agents</Badge>
          <h1 className="mt-6 max-w-5xl text-5xl font-semibold tracking-tight md:text-7xl">
            One constitution. Every agent. Safer commits.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Aegisure is the control & audit plane for AI coding agents — see, govern, and remember everything every agent does across Codex, Claude Code, Cursor, Copilot, Cline, and Roo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/auth">
              <Github className="h-4 w-4" />
              Sign in with GitHub
            </Button>
            <InstallCommand />
          </div>
          <p className="mt-5 text-sm text-muted-foreground">No card collection. No live charges. Static analysis runs without LLM keys.</p>
        </div>
        <FauxTerminal />
      </section>

      <section id="problem" className="border-y border-border bg-card/35 px-4 py-16 md:px-6">
        <div className="mx-auto max-w-5xl">
          <Badge>Problem</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">Agents ship code faster than humans can review it.</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Teams now use multiple coding agents at once. The work moves quickly, but review context gets scattered: who changed auth, which prompt caused the diff, which rules were violated, and whether another model disagreed.
          </p>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <Badge>How it works</Badge>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {howItWorks.map(([title, detail], index) => (
            <Card key={title}>
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 text-accent">{index + 1}</div>
              <h3 className="mt-5 text-sm font-medium">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
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
          {features.map((item) => (
            <Card key={item.title}>
              <CheckCircle2 className="h-5 w-5 text-accent" />
              <h3 className="mt-5 font-medium">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
            </Card>
          ))}
        </div>
        <Card className="mt-6 p-6">
          <p className="text-lg font-medium tracking-tight">
            Code review tools inspect PRs. Aegisure governs the agent workflow before, during, and after the change.
          </p>
        </Card>
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
          <div className="flex flex-wrap items-center gap-4">
            <code className="rounded-md border border-border bg-card px-2 py-1">pip install aegisure</code>
            <Link href="/docs" className="font-medium text-foreground">Docs</Link>
            <Link href="/pricing" className="font-medium text-foreground">Pricing</Link>
            <Link href="https://github.com/Hetul803/Aegisure" className="inline-flex items-center gap-1 font-medium text-foreground">
              GitHub <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
