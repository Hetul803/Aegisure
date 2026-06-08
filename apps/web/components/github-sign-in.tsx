"use client";

import { useState } from "react";
import { ArrowRight, Github, Loader2 } from "lucide-react";

export function GithubSignIn({ href }: { href: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <a
      href={href}
      onClick={() => setLoading(true)}
      className="smooth-pop mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      aria-busy={loading}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
      {loading ? "Redirecting to GitHub" : "Sign in with GitHub"}
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}
