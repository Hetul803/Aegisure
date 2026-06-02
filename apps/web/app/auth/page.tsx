import Link from "next/link";
import { AlertCircle, ArrowRight, Github, ShieldCheck } from "lucide-react";
import { Badge, Button, Card } from "../../components/ui";
import { ThemeToggle } from "../../components/theme-toggle";
import { githubOAuthUrl, supabaseConfig } from "../../lib/supabase";

export default function AuthPage() {
  const cfg = supabaseConfig();
  const url = githubOAuthUrl("/onboarding");
  return (
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-[1fr_480px]">
      <section className="hidden border-r border-border p-10 lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          Aegisure
        </Link>
        <div>
          <Badge tone="accent">Secure workspace sign-in</Badge>
          <h1 className="mt-6 max-w-2xl text-5xl font-semibold tracking-tight">Govern agent work from your GitHub identity.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
            Sign in to connect repositories, review PR risk, manage policies, and inspect provenance scoped to your workspace.
          </p>
        </div>
        <div className="grid gap-3 text-sm text-muted-foreground">
          {["Supabase GitHub OAuth", "Workspace-scoped backend access", "No LLM keys required for static scans"].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" />
              {item}
            </div>
          ))}
        </div>
      </section>
      <section className="flex items-center justify-center px-4 py-10">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md p-6">
          <Badge tone={cfg.configured ? "good" : "warn"}>{cfg.configured ? "Supabase ready" : "Supabase env missing"}</Badge>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight">Sign in with GitHub</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Aegisure uses Supabase Auth to create your workspace and scope repos, PR reports, audit events, and BYOK settings.
          </p>
          {cfg.configured ? (
            <a href={url} className="smooth-pop mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent/90">
              <Github className="h-4 w-4" />
              Continue with GitHub
              <ArrowRight className="h-4 w-4" />
            </a>
          ) : (
            <div className="mt-6 rounded-md border border-warning/30 bg-warning/10 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-200">
                <AlertCircle className="h-4 w-4" />
                Configure Supabase first
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to enable login.
              </p>
            </div>
          )}
          <div className="mt-5 flex items-center justify-between text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">Back to marketing site</Link>
            <Button href="/onboarding" variant="ghost">Preview onboarding</Button>
          </div>
        </Card>
      </section>
    </main>
  );
}
