"use client";

import { useEffect, useState } from "react";

type NavActive = "home" | "open" | "signup" | "login" | "account";

type Props = {
  active?: NavActive;
  /** Server-known session — avoids Log In flash on signup/account flows. */
  initialLoggedIn?: boolean;
};

export const AUTH_CHANGED_EVENT = "radar:auth-changed";

export function notifyAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function SiteNav({ active, initialLoggedIn = false }: Props) {
  const onWelcome = active === "account";
  const onSignup = active === "signup";
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn);

  useEffect(() => {
    setLoggedIn(initialLoggedIn);
  }, [initialLoggedIn]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (cancelled) return;
        setLoggedIn(res.ok);
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

  const accountLink = (
    <a
      className={`nav-login${active === "account" ? " is-active" : ""}`}
      href="/account"
      aria-current={active === "account" ? "page" : undefined}
    >
      My Watchlist
    </a>
  );

  const loginLink = (
    <a
      className={`nav-login${active === "login" ? " is-active" : ""}`}
      href="/login"
      aria-current={active === "login" ? "page" : undefined}
    >
      Log In
    </a>
  );

  const applyNowLink = (
    <a
      className={`nav-apply${active === "open" ? " is-active" : ""}`}
      href="/open"
      aria-current={active === "open" ? "page" : undefined}
    >
      Apply Now
    </a>
  );

  return (
    <nav className="nav">
      <a className="brand" href="/">
        <span className="brand-fire" aria-hidden="true">
          🚨
        </span>
        <span className="brand-name">
          Radar<span>Apply</span>
        </span>
      </a>
      <div className="nav-actions">
        {onWelcome ? (
          <>
            {applyNowLink}
            <a className="nav-link" href="/">
              Home
            </a>
          </>
        ) : onSignup ? (
          <>
            {applyNowLink}
            <a className="nav-link" href="/#about">
              About
            </a>
            {loggedIn ? accountLink : loginLink}
          </>
        ) : (
          <>
            {applyNowLink}
            {active === "home" ? (
              <a className="nav-link" href="#about">
                About
              </a>
            ) : null}
            {!loggedIn ? (
              <a className="btn-primary hero-signup nav-signup" href="/signup">
                Start Tracking
              </a>
            ) : null}
            {loggedIn ? accountLink : loginLink}
          </>
        )}
      </div>
    </nav>
  );
}
