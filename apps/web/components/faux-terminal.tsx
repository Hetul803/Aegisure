"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Badge } from "./ui";

const sequences = [
  {
    badge: "constitution",
    tone: "accent" as const,
    lines: [
      "$ aegisure init",
      "Scanned repository structure, package files, tests, and agent rules.",
      "Generated Aegisure.md",
    ],
  },
  {
    badge: "blocked before merge",
    tone: "bad" as const,
    lines: [
      "$ aegisure scan --staged",
      "diff --git a/app.py b/app.py",
      '+OPENAI_API_KEY=\"sk-proj-...\"',
      "Aegisure verdict: block (100/100)",
      "CRITICAL secret_in_diff at app.py:1",
    ],
  },
  {
    badge: "repair prompt",
    tone: "warn" as const,
    lines: [
      "$ aegisure repair --staged",
      "Constrained repair prompt:",
      "Fix only secret_in_diff in app.py. Remove the credential.",
      "Do not touch unrelated files.",
      "Add a regression test if config loading exposed it.",
    ],
  },
  {
    badge: "repo readiness",
    tone: "neutral" as const,
    lines: [
      "$ aegisure doctor",
      "OK   Git repository detected",
      "OK   .env is ignored",
      "WARN Aegisure.md changed; run aegisure export to sync agent files",
    ],
  },
];

const finalFrame = sequences[sequences.length - 1];

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function FauxTerminal() {
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [index, setIndex] = useState(sequences.length - 1);
  const [chars, setChars] = useState(finalFrame.lines.join("\n").length);
  const full = useMemo(() => sequences[index].lines.join("\n"), [index]);

  useEffect(() => {
    const reduce = prefersReducedMotion();
    setReduced(reduce);
    setIndex(reduce ? sequences.length - 1 : 0);
    setChars(reduce ? finalFrame.lines.join("\n").length : 0);
  }, []);

  useEffect(() => {
    if (paused || reduced) return;
    const id = window.setInterval(() => {
      setChars((current) => {
        if (current >= full.length) return current;
        return current + 2;
      });
    }, 42);
    return () => window.clearInterval(id);
  }, [full.length, paused, reduced]);

  useEffect(() => {
    if (paused || reduced || chars < full.length) return;
    const timeout = window.setTimeout(() => {
      setIndex((current) => (current + 1) % sequences.length);
      setChars(0);
    }, 1900);
    return () => window.clearTimeout(timeout);
  }, [chars, full.length, paused, reduced]);

  const text = reduced ? full : full.slice(0, chars);
  const current = reduced ? finalFrame : sequences[index];

  return (
    <section className="elevated-surface overflow-hidden rounded-lg" aria-label="Aegisure terminal demo">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
        </div>
        <Badge tone={current.tone}>{current.badge}</Badge>
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          className="smooth-pop rounded-md border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          aria-label={paused ? "Play terminal animation" : "Pause terminal animation"}
        >
          {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
        </button>
      </div>
      <pre className="min-h-[360px] overflow-hidden whitespace-pre-wrap break-words p-5 text-left text-[13px] leading-6 text-muted-foreground [overflow-wrap:anywhere] sm:text-sm">
        <code className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
          {text}
          {!paused && !reduced && chars < full.length ? <span className="text-accent">▌</span> : null}
        </code>
      </pre>
    </section>
  );
}
