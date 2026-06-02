"use client";

import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";

export function ByokForm() {
  const [provider, setProvider] = useState("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState("Keys are encrypted before storage. Static scans never require a key.");

  async function saveKey(event: FormEvent) {
    event.preventDefault();
    setStatus("Saving encrypted key...");
    const token = document.cookie.split("; ").find((item) => item.startsWith("aegisure_token="))?.split("=")[1] || "";
    if (!token) {
      setStatus("Sign in first, then save a BYOK key.");
      return;
    }
    const res = await fetch(`${process.env.NEXT_PUBLIC_AEGISURE_BACKEND_URL || "http://127.0.0.1:8000"}/settings/llm-key`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        "x-aegisure-workspace": "local",
      },
      body: JSON.stringify({ provider, api_key: apiKey }),
    });
    setStatus(res.ok ? `${provider} key saved. BYOK calls are uncapped.` : "Could not save key. Check backend auth and try again.");
    if (res.ok) setApiKey("");
  }

  return (
    <form onSubmit={saveKey} className="mt-4 grid gap-3">
      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <select value={provider} onChange={(event) => setProvider(event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-accent/40">
          <option value="anthropic">Anthropic</option>
          <option value="openai">OpenAI</option>
        </select>
        <input
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder="Paste your API key"
          type="password"
          className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs leading-5 text-muted-foreground">{status}</p>
        <button type="submit" className="smooth-pop inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent/90">
          <KeyRound className="h-4 w-4" />
          Save key
        </button>
      </div>
    </form>
  );
}
