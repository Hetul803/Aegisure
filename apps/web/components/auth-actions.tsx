"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Github } from "lucide-react";
import { SignOutButton } from "./sign-out-button";

function hasSessionCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((cookie) => cookie.trim().startsWith("aegisure_token="));
}

export function AuthActions() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setSignedIn(hasSessionCookie());
  }, []);

  if (signedIn) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden rounded-md border border-border bg-card/95 px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm shadow-black/5 dark:shadow-black/20 sm:inline-flex">
          Signed in
        </span>
        <SignOutButton />
      </div>
    );
  }

  return (
    <Link
      href="/auth"
      className="smooth-pop inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card/95 px-3 text-sm font-medium text-foreground shadow-sm shadow-black/5 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:shadow-black/20"
    >
      <Github className="h-4 w-4" />
      <span className="hidden sm:inline">Sign in with GitHub</span>
      <span className="sm:hidden">Sign in</span>
    </Link>
  );
}
