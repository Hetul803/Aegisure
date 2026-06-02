import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Command, Github, Search } from "lucide-react";
import { AuthCapture } from "./auth-capture";
import { SignOutButton } from "./sign-out-button";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "../lib/utils";
import { navItems } from "../lib/data";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" | "accent" }) {
  const tones = {
    neutral: "border-border bg-muted/55 text-muted-foreground",
    good: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    warn: "border-warning/30 bg-warning/10 text-amber-700 dark:text-amber-300",
    bad: "border-danger/30 bg-danger/10 text-rose-700 dark:text-rose-300",
    accent: "border-accent/25 bg-accent/10 text-teal-700 dark:text-teal-200",
  };
  return <span className={cn("inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium", tones[tone])}>{children}</span>;
}

export function Button({ children, href, variant = "primary", className = "" }: { children: ReactNode; href?: string; variant?: "primary" | "secondary" | "ghost"; className?: string }) {
  const classes = cn(
    "smooth-pop inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
    variant === "primary" && "bg-accent text-accent-foreground shadow-sm shadow-teal-950/10 hover:bg-accent/90",
    variant === "secondary" && "border border-border bg-card text-foreground hover:bg-muted/70",
    variant === "ghost" && "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
    className,
  );
  if (href) return <Link href={href} className={classes}>{children}</Link>;
  return <button className={classes}>{children}</button>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={cn("hairline rounded-lg bg-card/82 p-5 shadow-sm shadow-black/5 backdrop-blur-sm dark:bg-card/78", className)}>{children}</section>;
}

export function EmptyState({
  title,
  detail,
  description,
  action,
  actionHref,
  actionLabel,
}: {
  title: string;
  detail?: string;
  description?: string;
  action?: ReactNode;
  actionHref?: string;
  actionLabel?: string;
}) {
  const copy = description || detail || "";
  return (
    <Card className="flex min-h-44 flex-col items-start justify-center">
      <Badge>Empty state</Badge>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{copy}</p>
      {action ? <div className="mt-5">{action}</div> : null}
      {actionHref && actionLabel ? <Button href={actionHref} className="mt-5">{actionLabel}</Button> : null}
    </Card>
  );
}

export function StatCard({ label, value, detail = "", tone = "neutral" }: { label: string; value: string | number; detail?: string; tone?: "neutral" | "good" | "warn" | "bad" }) {
  return (
    <Card>
      <Badge tone={tone}>{label}</Badge>
      <div className="mt-4 text-3xl font-semibold tracking-tight">{value}</div>
      {detail ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p> : null}
    </Card>
  );
}

export function AppShell({ children, current = "dashboard" }: { children: ReactNode; current?: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AuthCapture />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-border bg-card/70 p-4 backdrop-blur-xl lg:block">
        <div className="flex h-full flex-col">
          <Link href="/" className="flex items-center gap-3 rounded-md px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <Command className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">Aegisure</div>
              <div className="text-xs text-muted-foreground">Agent control plane</div>
            </div>
          </Link>
          <nav className="mt-8 space-y-1">
            {navItems.map((item) => {
              const active = current === item.key;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "smooth-pop flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                    active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Card className="mt-auto p-4">
            <Badge tone="accent">Workspace</Badge>
            <p className="mt-3 text-sm font-medium">Local workspace</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Data is scoped by workspace. Connect Supabase and GitHub App for live team use.</p>
          </Card>
        </div>
      </aside>
      <main className="lg:pl-72">
        <TopBar />
        {children}
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/78 px-4 py-3 backdrop-blur-xl md:px-6 lg:px-10">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold lg:hidden">
          <Command className="h-4 w-4 text-accent" />
          Aegisure
        </Link>
        <div className="hidden min-w-0 items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground md:flex">
          <Search className="h-4 w-4" />
          <span>Search audit, provenance, policies...</span>
          <kbd className="ml-8 rounded border border-border px-1.5 py-0.5 text-[10px]">⌘K</kbd>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button href="/auth" variant="secondary" className="hidden sm:inline-flex">
            <Github className="h-4 w-4" />
            Sign in
          </Button>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

export function PageHeader({ eyebrow, title, children, action }: { eyebrow: string; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="border-b border-border px-4 py-8 md:px-6 lg:px-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge tone="accent">{eyebrow}</Badge>
          <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight md:text-5xl">{title}</h1>
          {children ? <div className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">{children}</div> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

export function SectionHeader({ eyebrow, title, detail, description, action }: { eyebrow?: string; title: string; detail?: string; description?: string; action?: ReactNode }) {
  const copy = description || detail;
  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <Badge tone="accent">{eyebrow}</Badge> : null}
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {copy ? <p className="mt-1 text-sm text-muted-foreground">{copy}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200">
      {children}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}
