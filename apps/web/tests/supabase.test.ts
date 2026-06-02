import { describe, expect, it, vi } from "vitest";

describe("supabase config", () => {
  it("reports missing config without using sample data", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const mod = await import("../lib/supabase");
    expect(mod.supabaseConfig().configured).toBe(false);
  });
});
