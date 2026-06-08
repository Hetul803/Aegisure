import Link from "next/link";
import { ArrowRight, Copy, ShieldCheck } from "lucide-react";
import { Badge, Button, Card } from "../../components/ui";
import { ThemeToggle } from "../../components/theme-toggle";

const commands = [
  {
    name: "init",
    description: "Scan the repository and generate the canonical Aegisure.md Constitution.",
    usage: "aegisure init",
    example: "aegisure init",
  },
  {
    name: "export",
    description: "Export Aegisure.md into the standard rule files used by coding agents.",
    usage: "aegisure export",
    example: "aegisure export",
  },
  {
    name: "scan",
    description: "Analyze staged, changed, or committed diffs for blocking risk and policy violations.",
    usage: "aegisure scan --staged [--json]",
    example: "aegisure scan --staged",
  },
  {
    name: "repair",
    description: "Create a constrained prompt that tells an agent exactly what to fix.",
    usage: "aegisure repair --staged --agent <agent>",
    example: "aegisure repair --staged --agent codex",
  },
  {
    name: "review",
    description: "Request an optional second opinion on the current diff when an LLM provider is configured.",
    usage: "aegisure review --staged",
    example: "aegisure review --staged",
  },
  {
    name: "commit",
    description: "Commit changes while recording declared agent provenance and the originating prompt.",
    usage: 'aegisure commit -m "<message>" --agent <agent> --prompt "<prompt>"',
    example: 'aegisure commit -m "Fix auth redirect" --agent codex --prompt "Repair OAuth callback handling"',
  },
  {
    name: "doctor",
    description: "Run a read-only readiness check for Constitution drift, ignored secrets, and CI setup.",
    usage: "aegisure doctor",
    example: "aegisure doctor",
  },
  {
    name: "run",
    description: "Start or end a snapshot-and-scan session around normal agent work.",
    usage: "aegisure run [--end]",
    example: "aegisure run\n# work with your agent\naegisure run --end",
  },
  {
    name: "rewind",
    description: "Safely prepare a git-based rollback for the last Aegisure-attributed change.",
    usage: "aegisure rewind last",
    example: "aegisure rewind last",
  },
  {
    name: "login",
    description: "Authenticate the CLI to a workspace, or keep using local mode with SQLite.",
    usage: "aegisure login",
    example: "aegisure login",
  },
];

export default function CliDocsPage() {
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
          <Link href="/#features" className="hover:text-foreground">Features</Link>
          <Link href="/docs" className="text-foreground">Docs</Link>
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button href="/auth">Sign in with GitHub</Button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <Badge tone="accent">CLI reference</Badge>
        <div className="mt-6 grid gap-8 lg:grid-cols-[0.86fr_0.44fr] lg:items-start">
          <div>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
              Govern agent work from the terminal first.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              The CLI is the fastest way to generate Aegisure.md, scan risky diffs, export cross-agent memory files, capture provenance, and create constrained repair prompts.
            </p>
          </div>
          <Card className="p-4">
            <div className="flex items-center justify-between gap-3">
              <Badge>Install</Badge>
              <Copy className="h-4 w-4 text-muted-foreground" />
            </div>
            <pre className="mt-4 overflow-x-auto rounded-md border border-border bg-background p-4 text-sm text-muted-foreground"><code>pip install aegisure{"\n"}aegisure --help</code></pre>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-6">
        <div className="grid gap-4">
          {commands.map((command) => (
            <Card key={command.name} className="grid gap-5 p-5 md:grid-cols-[12rem_minmax(0,1fr)] lg:grid-cols-[14rem_minmax(0,1fr)_minmax(18rem,0.9fr)] lg:items-start">
              <div className="min-w-0">
                <Badge tone="accent">aegisure {command.name}</Badge>
                <h2 className="mt-3 text-lg font-semibold tracking-tight">{command.name}</h2>
              </div>
              <div className="min-w-0">
                <p className="text-sm leading-6 text-muted-foreground">{command.description}</p>
                <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Usage</p>
                <code className="mt-2 block whitespace-pre-wrap break-words rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground [overflow-wrap:anywhere]">{command.usage}</code>
              </div>
              <div className="min-w-0 md:col-start-2 lg:col-start-auto">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Example</p>
                <pre className="mt-2 overflow-hidden whitespace-pre-wrap break-words rounded-md border border-border bg-background p-3 text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]"><code className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{command.example}</code></pre>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>Aegisure CLI reference</span>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/" className="inline-flex items-center gap-1 font-medium text-foreground">
              Home <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/pricing" className="font-medium text-foreground">Pricing</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
