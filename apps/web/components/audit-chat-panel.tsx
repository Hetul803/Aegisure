"use client";

import { FormEvent, useMemo, useState } from "react";
import { MessageSquareText, Send } from "lucide-react";
import { Badge, Button, Card } from "./ui";
import type { AuditResponse, LedgerResponse, RiskReportsResponse } from "../lib/api";

type ChatRecord = {
  source: "audit" | "attribution" | "provenance" | "risk";
  label: string;
  text: string;
  created_at?: string;
  raw: unknown;
};

type Message = {
  role: "user" | "aegisure";
  text: string;
  records?: ChatRecord[];
  needsKey?: boolean;
};

const examples = ["what did Codex change today?", "which agent touched auth this week?", "show risky PRs still open."];

function cookieToken() {
  return document.cookie.split("; ").find((item) => item.startsWith("aegisure_token="))?.split("=")[1] || "";
}

function stringify(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function buildRecords(audit: AuditResponse, attribution: LedgerResponse, provenance: LedgerResponse, risk: RiskReportsResponse): ChatRecord[] {
  return [
    ...audit.events.map((event) => ({
      source: "audit" as const,
      label: event.event_type || "audit event",
      text: `${event.event_type || "event"} ${event.message || ""} ${stringify(event.payload || {})}`,
      created_at: event.created_at,
      raw: event,
    })),
    ...attribution.records.map((record) => ({
      source: "attribution" as const,
      label: `${String(record.agent || "unknown")} touched ${String(record.path || "a file")}`,
      text: stringify(record),
      created_at: String(record.created_at || ""),
      raw: record,
    })),
    ...provenance.records.map((record) => ({
      source: "provenance" as const,
      label: `${String(record.agent || "unknown")} prompt provenance`,
      text: stringify(record),
      created_at: String(record.created_at || ""),
      raw: record,
    })),
    ...risk.reports.map((report) => ({
      source: "risk" as const,
      label: `${String(report.verdict || "risk report")} ${report.score ?? 0}/100`,
      text: stringify(report),
      raw: report,
    })),
  ];
}

function findGroundedRecords(question: string, records: ChatRecord[]) {
  const query = question.toLowerCase();
  let matches = records;
  if (query.includes("codex")) matches = matches.filter((record) => record.text.toLowerCase().includes("codex"));
  if (query.includes("auth")) matches = matches.filter((record) => record.text.toLowerCase().includes("auth"));
  if (query.includes("risky") || query.includes("risk") || query.includes("open")) {
    matches = matches.filter((record) => record.source === "risk" || /require_review|block|critical|high|risk/i.test(record.text));
  }
  if (query.includes("today")) {
    const today = new Date().toISOString().slice(0, 10);
    const dated = matches.filter((record) => (record.created_at || "").startsWith(today));
    matches = dated.length ? dated : matches;
  }
  return matches.slice(0, 6);
}

function fallbackAnswer(question: string, records: ChatRecord[]) {
  if (!records.length) {
    return "I do not have matching workspace records for that yet. Connect a repo or process a PR, then ask again.";
  }
  if (question.toLowerCase().includes("codex")) {
    return `I found ${records.length} Codex-related workspace record${records.length === 1 ? "" : "s"}.`;
  }
  if (question.toLowerCase().includes("auth")) {
    return `I found ${records.length} workspace record${records.length === 1 ? "" : "s"} touching auth-related context.`;
  }
  if (question.toLowerCase().includes("risk")) {
    return `I found ${records.length} risk-related workspace record${records.length === 1 ? "" : "s"}.`;
  }
  return `I found ${records.length} relevant workspace record${records.length === 1 ? "" : "s"}.`;
}

export function AuditChatPanel({
  audit,
  attribution,
  provenance,
  risk,
}: {
  audit: AuditResponse;
  attribution: LedgerResponse;
  provenance: LedgerResponse;
  risk: RiskReportsResponse;
}) {
  const records = useMemo(() => buildRecords(audit, attribution, provenance, risk), [audit, attribution, provenance, risk]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "aegisure",
      text: "Ask about your audit log, attribution ledger, provenance timeline, or risk reports. Answers stay grounded in this workspace.",
    },
  ]);

  async function ask(event?: FormEvent, preset?: string) {
    event?.preventDefault();
    const text = (preset || question).trim();
    if (!text) return;
    const grounded = findGroundedRecords(text, records);
    setQuestion("");
    setLoading(true);
    setMessages((current) => [...current, { role: "user", text }]);

    let answer = fallbackAnswer(text, grounded);
    let needsKey = false;
    const token = cookieToken();
    if (token) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_AEGISURE_BACKEND_URL || "http://127.0.0.1:8000"}/audit/chat`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
            "x-aegisure-workspace": process.env.NEXT_PUBLIC_AEGISURE_WORKSPACE_ID || "local",
          },
          body: JSON.stringify({ question: text }),
        });
        const payload = await res.json();
        if (res.ok && payload.status === "completed" && payload.answer) {
          answer = payload.answer;
        } else {
          needsKey = true;
          answer = `${answer} Add a BYOK key in Settings to enable natural-language phrasing over these grounded records.`;
        }
      } catch {
        needsKey = true;
        answer = `${answer} I could not reach the backend phrasing endpoint, so I am showing the grounded records directly.`;
      }
    } else {
      needsKey = true;
      answer = `${answer} Sign in and add a BYOK key to enable natural-language answers; raw grounded records are still shown here.`;
    }

    setMessages((current) => [...current, { role: "aegisure", text: answer, records: grounded, needsKey }]);
    setLoading(false);
  }

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <Badge>Audit chatbot</Badge>
          <h2 className="mt-3 text-lg font-semibold tracking-tight">Ask grounded questions over workspace data</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            It reads audit events, attribution, provenance, and risk reports first. It is not a general chatbot.
          </p>
        </div>
        <Badge tone={records.length ? "good" : "warn"}>{records.length} records indexed</Badge>
      </div>
      <div className="mt-5 space-y-3">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`rounded-lg border border-border p-4 ${message.role === "user" ? "bg-muted/45" : "bg-background/70"}`}>
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-accent" />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{message.role === "user" ? "You" : "Aegisure"}</span>
              {message.needsKey ? <Badge tone="warn">BYOK/cap gated</Badge> : null}
            </div>
            <p className="mt-3 text-sm leading-6 text-foreground">{message.text}</p>
            {message.records?.length ? (
              <div className="mt-4 space-y-2">
                {message.records.map((record, recordIndex) => (
                  <details key={`${record.source}-${recordIndex}`} className="rounded-md border border-border bg-card/70 p-3">
                    <summary className="cursor-pointer text-sm font-medium">{record.source}: {record.label}</summary>
                    <pre className="mt-3 max-h-52 overflow-auto whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{stringify(record.raw)}</pre>
                  </details>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {examples.map((item) => (
          <button key={item} type="button" onClick={() => ask(undefined, item)} className="smooth-pop rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
            {item}
          </button>
        ))}
      </div>
      <form onSubmit={ask} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask: which agent touched auth this week?"
          className="h-11 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
        />
        <Button className="sm:w-32">
          <Send className="h-4 w-4" />
          {loading ? "Asking" : "Ask"}
        </Button>
      </form>
    </Card>
  );
}
