const baseUrl = process.env.AEGISURE_BACKEND_URL || process.env.NEXT_PUBLIC_AEGISURE_BACKEND_URL || "http://127.0.0.1:8000";

export async function backendGet<T>(path: string, fallback: T): Promise<T> {
  const { cookies } = await import("next/headers");
  const token = cookies().get("aegisure_token")?.value || process.env.AEGISURE_API_TOKEN || "";
  if (!token) return fallback;
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { authorization: `Bearer ${token}`, "x-aegisure-workspace": process.env.AEGISURE_WORKSPACE_ID || "local" },
      cache: "no-store",
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export type RiskReportsResponse = { reports: Array<{ id?: string; verdict?: string; score?: number; summary?: string; findings?: unknown[] }> };
export type ReposResponse = { repos: Array<{ full_name?: string; name?: string; risk?: number; status?: string; open_prs?: number }> };
export type AuditResponse = { events: Array<{ id?: number | string; event_type?: string; message?: string; created_at?: string; payload?: unknown }> };
export type SettingsResponse = { cap_status?: { cap_usd: number; used_usd: number; remaining_usd: number; reached: boolean }; providers?: string[] };
export type LedgerResponse = { records: Array<Record<string, unknown>> };
export type PoliciesResponse = { policies: Array<Record<string, unknown>>; default_policy_yaml?: string };
