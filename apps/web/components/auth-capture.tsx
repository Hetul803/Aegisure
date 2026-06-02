"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "../lib/supabase";

export function AuthCapture() {
  useEffect(() => {
    const cfg = supabaseConfig();
    if (!cfg.configured) return;
    const client = createClient(cfg.url, cfg.anonKey);
    client.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (token) {
        document.cookie = `aegisure_token=${token}; path=/; max-age=604800; SameSite=Lax`;
      }
    });
  }, []);
  return null;
}
