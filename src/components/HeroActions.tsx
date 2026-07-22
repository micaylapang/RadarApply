"use client";

import { useEffect, useState } from "react";
import { AUTH_CHANGED_EVENT } from "@/components/SiteNav";

type Props = {
  initialLoggedIn?: boolean;
};

export function HeroActions({ initialLoggedIn = false }: Props) {
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn);

  useEffect(() => {
    setLoggedIn(initialLoggedIn);
  }, [initialLoggedIn]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!cancelled) setLoggedIn(res.ok);
      } catch {
        if (!cancelled) setLoggedIn(false);
      }
    }

    refresh();

    function onAuthChanged() {
      void refresh();
    }

    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    window.addEventListener("focus", onAuthChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
      window.removeEventListener("focus", onAuthChanged);
    };
  }, []);

  if (loggedIn) {
    return (
      <div className="hero-actions">
        <a className="btn-primary hero-signup" href="/signup?add=1">
          Track more
        </a>
        <a className="btn-ghost hero-login" href="/account">
          My Watchlist
        </a>
      </div>
    );
  }

  return (
    <div className="hero-actions">
      <a className="btn-primary hero-signup" href="/signup">
        Start Tracking
      </a>
      <a className="btn-ghost hero-login" href="/login">
        Log In
      </a>
    </div>
  );
}
