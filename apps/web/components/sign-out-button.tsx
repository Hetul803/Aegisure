"use client";

import { LogOut } from "lucide-react";

export function SignOutButton() {
  function signOut() {
    document.cookie = "aegisure_token=; path=/; max-age=0; SameSite=Lax";
    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="smooth-pop inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent/50"
      aria-label="Sign out"
      title="Sign out"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
