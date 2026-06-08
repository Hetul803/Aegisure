"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function InstallCommand() {
  const [copied, setCopied] = useState(false);
  const command = "pip install aegisure";

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="smooth-pop inline-flex h-10 items-center gap-3 rounded-md border border-border bg-card px-3 font-mono text-sm text-foreground hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      aria-label="Copy pip install aegisure"
    >
      <span>{command}</span>
      {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
    </button>
  );
}
