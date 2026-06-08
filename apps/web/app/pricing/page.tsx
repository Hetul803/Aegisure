import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Badge, Button, Card } from "../../components/ui";
import { ThemeToggle } from "../../components/theme-toggle";

const betaNotes = [
  "Static CLI scanning and Constitution export are available during beta.",
  "GitHub App, dashboard, audit trail, and BYOK settings are being prepared for early teams.",
  "Paid team plans are planned after beta feedback, with no checkout in this preview.",
];

export default function PricingPage() {
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
          <Link href="/docs" className="hover:text-foreground">Docs</Link>
          <Link href="/pricing" className="text-foreground">Pricing</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button href="/auth">Sign in with GitHub</Button>
        </div>
      </header>

      <section className="mx-auto grid min-h-[68vh] max-w-7xl items-center gap-8 px-4 py-16 md:px-6 lg:grid-cols-[0.9fr_0.7fr]">
        <div>
          <Badge tone="accent">Beta access</Badge>
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
            Free during beta. Team plans come later.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Aegisure is focused on proving the control and audit workflow before introducing paid plans. There is no checkout, no card collection, and no payment processing in this beta surface.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/auth">Get started free</Button>
            <Button href="/docs" variant="secondary">Read CLI docs</Button>
          </div>
        </div>

        <Card className="p-6">
          <Badge>What beta includes</Badge>
          <div className="mt-5 space-y-4">
            {betaNotes.map((note) => (
              <div key={note} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p className="text-sm leading-6 text-muted-foreground">{note}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-md border border-border bg-muted/45 p-4 text-sm leading-6 text-muted-foreground">
            Want updates when team plans open? Use the GitHub sign-in flow or follow the repository for beta announcements.
          </div>
        </Card>
      </section>

      <footer className="border-t border-border px-4 py-8 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>Aegisure beta pricing</span>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/docs" className="font-medium text-foreground">Docs</Link>
            <Link href="/" className="inline-flex items-center gap-1 font-medium text-foreground">
              Home <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
