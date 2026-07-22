"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FREE_COMPANY_LIMIT,
  SEASON_PASS_DESCRIPTION,
  SEASON_PASS_NAME,
  SEASON_PASS_PRICE_CENTS,
} from "@/lib/limits";
import { formatSeasonPassExpiry } from "@/lib/season-pass";

function dollars(cents: number) {
  return (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}

export function UpgradeCheckout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const success = searchParams.get("success") === "1";
  const canceled = searchParams.get("canceled") === "1";
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPass, setHasPass] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.status === 401) {
          if (!cancelled) setLoggedIn(false);
          return;
        }
        const data = (await res.json()) as {
          user?: {
            hasSeasonPass?: boolean;
            seasonPassExpiresAt?: string | null;
          };
          plan?: {
            hasSeasonPass?: boolean;
            seasonPassExpiresAt?: string | null;
          };
        };
        if (!cancelled) {
          setLoggedIn(true);
          const active =
            Boolean(data.user?.hasSeasonPass) ||
            Boolean(data.plan?.hasSeasonPass);
          setHasPass(active);
          setExpiresAt(
            data.user?.seasonPassExpiresAt ??
              data.plan?.seasonPassExpiresAt ??
              null,
          );
        }
      } catch {
        if (!cancelled) setLoggedIn(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!success || !sessionId || hasPass) return;
    let cancelled = false;
    setConfirming(true);
    (async () => {
      try {
        const res = await fetch("/api/billing/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          expiresAt?: string | null;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Could not confirm your pass yet.");
          return;
        }
        setHasPass(true);
        setExpiresAt(data.expiresAt ?? null);
      } catch {
        if (!cancelled) setError("Network error confirming payment.");
      } finally {
        if (!cancelled) setConfirming(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [success, sessionId, hasPass]);

  const headline = useMemo(() => {
    if (hasPass) return "You're unlocked for the season.";
    if (reason === "limit") return "You've hit the free company limit.";
    return "Track every company on your radar.";
  }, [hasPass, reason]);

  async function startCheckout() {
    setError(null);
    if (loggedIn === false) {
      router.push("/login?from=upgrade");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = (await res.json()) as {
        url?: string;
        error?: string;
        loginRequired?: boolean;
        alreadyActive?: boolean;
        expiresAt?: string | null;
      };
      if (res.status === 401 || data.loginRequired) {
        router.push("/login?from=upgrade");
        return;
      }
      if (res.status === 409 || data.alreadyActive) {
        setHasPass(true);
        setExpiresAt(data.expiresAt ?? null);
        return;
      }
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start checkout.");
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="upgrade-page">
      <header className="upgrade-head">
        <p className="upgrade-kicker">Season pass</p>
        <h1>{headline}</h1>
        <p className="upgrade-sub">
          Free includes Apply Now plus {FREE_COMPANY_LIMIT} companies to watch.
          The {SEASON_PASS_NAME} unlocks unlimited tracking through{" "}
          {formatSeasonPassExpiry()}.
        </p>
      </header>

      {canceled ? (
        <p className="form-error" role="status">
          Checkout canceled — you can try again anytime.
        </p>
      ) : null}
      {confirming ? (
        <p className="upgrade-note" role="status">
          Confirming your payment…
        </p>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}

      <div className="upgrade-plans upgrade-plans-single">
        <article
          className={`upgrade-plan${hasPass ? "" : " is-featured"}`}
        >
          {hasPass ? (
            <p className="upgrade-badge">Active</p>
          ) : (
            <p className="upgrade-badge">Best value</p>
          )}
          <h2>{SEASON_PASS_NAME}</h2>
          <div className="upgrade-price">
            {hasPass ? (
              <span className="upgrade-amount">Unlocked</span>
            ) : (
              <>
                <span className="upgrade-amount">
                  ${dollars(SEASON_PASS_PRICE_CENTS)}
                </span>
                <span className="upgrade-period">one-time</span>
              </>
            )}
          </div>
          <p className="upgrade-blurb">
            {hasPass
              ? `Unlimited company tracking through ${formatSeasonPassExpiry(expiresAt ?? undefined)}.`
              : SEASON_PASS_DESCRIPTION}
          </p>
          <ul>
            <li>Unlimited companies on your tracking list</li>
            <li>SMS the moment a watched listing opens</li>
            <li>Valid through {formatSeasonPassExpiry()}</li>
          </ul>
          {hasPass ? (
            <a className="upgrade-cta is-primary" href="/signup?add=1">
              Add companies
            </a>
          ) : (
            <button
              className="upgrade-cta is-primary"
              type="button"
              disabled={loading || confirming || loggedIn === null}
              onClick={startCheckout}
            >
              {loggedIn === false
                ? "Log in to buy"
                : loading
                  ? "Starting checkout…"
                  : `Get season pass — $${dollars(SEASON_PASS_PRICE_CENTS)}`}
            </button>
          )}
        </article>

        {!hasPass ? (
          <article className="upgrade-plan">
            <h2>Free</h2>
            <div className="upgrade-price">
              <span className="upgrade-amount">$0</span>
            </div>
            <p className="upgrade-blurb">
              Apply Now links plus {FREE_COMPANY_LIMIT} companies on your watch
              list.
            </p>
            <ul>
              <li>Track up to {FREE_COMPANY_LIMIT} companies</li>
              <li>SMS alerts when those roles open</li>
              <li>Upgrade anytime</li>
            </ul>
            <a className="upgrade-cta is-muted" href="/signup">
              Stay on free
            </a>
          </article>
        ) : (
          <article className="upgrade-plan">
            <h2>Account</h2>
            <p className="upgrade-blurb">
              Manage your tracking list and phone number anytime.
            </p>
            <a className="upgrade-cta" href="/account">
              Open account
            </a>
          </article>
        )}
      </div>

      <p className="upgrade-note">
        Secure checkout via Stripe. Questions?{" "}
        <a href="mailto:radarapply@gmail.com">radarapply@gmail.com</a>
      </p>
    </div>
  );
}
