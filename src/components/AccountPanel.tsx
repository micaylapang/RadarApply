"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { companyLogoUrl } from "@/lib/company-logos";
import {
  companyOpenSince,
  formatOpenSinceDate,
} from "@/lib/company-status";
import { FREE_COMPANY_LIMIT, MONETIZATION_ENABLED, UPGRADE_PATH } from "@/lib/limits";
import { formatPhoneDisplay } from "@/lib/phone";
import { dedupeByCompanyRole, roleBaseTitle } from "@/lib/role-meta";
import { formatSeasonPassExpiry } from "@/lib/season-pass";
import { notifyAuthChanged } from "@/components/SiteNav";

type Tracking = {
  id: string;
  company: string;
  title: string;
  status: string;
  openedAt?: string | null;
};

type AccountUser = {
  id: string;
  name: string;
  phone: string;
  hasSeasonPass?: boolean;
  seasonPassExpiresAt?: string | null;
};

type AccountPlan = {
  hasSeasonPass: boolean;
  seasonPassExpiresAt: string | null;
  freeCompanyLimit: number;
  companyCount: number;
};

function firstName(name: string) {
  const part = name.trim().split(/\s+/)[0];
  return part || name.trim() || "there";
}

function trackerStatusLabel(item: Tracking): string {
  if (item.status !== "open") return "waiting ⏳";
  const since = companyOpenSince(item.company, [item.openedAt ?? null]);
  if (since) return `open since ${formatOpenSinceDate(since)} ✅`;
  return "open ✅";
}

function CompanyLogo({ company }: { company: string }) {
  const [failed, setFailed] = useState(false);
  const src = companyLogoUrl(company);
  const initial = company.trim().charAt(0).toUpperCase() || "?";

  if (!src || failed) {
    return (
      <span className="company-logo company-logo-fallback" aria-hidden="true">
        {initial}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="company-logo"
      src={src}
      alt=""
      width={22}
      height={22}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export function AccountPanel() {
  const router = useRouter();
  const [user, setUser] = useState<AccountUser | null>(null);
  const [plan, setPlan] = useState<AccountPlan | null>(null);
  const [tracking, setTracking] = useState<Tracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        const data = (await res.json()) as {
          user?: AccountUser;
          plan?: AccountPlan;
          tracking?: Tracking[];
          error?: string;
        };
        if (!res.ok || !data.user) {
          setError(data.error ?? "Could not load your account.");
          return;
        }
        if (!cancelled) {
          setUser(data.user);
          setPlan(
            data.plan ?? {
              hasSeasonPass: Boolean(data.user.hasSeasonPass),
              seasonPassExpiresAt: data.user.seasonPassExpiresAt ?? null,
              freeCompanyLimit: FREE_COMPANY_LIMIT,
              companyCount: 0,
            },
          );
          setTracking(data.tracking ?? []);
        }
      } catch {
        if (!cancelled) setError("Network error. Try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function removeWatch(internshipId: string) {
    const ok = window.confirm(
      "Are you sure you want to remove tracking for this role?",
    );
    if (!ok) return;

    setRemovingId(internshipId);
    setError(null);
    try {
      const res = await fetch("/api/auth/subscriptions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internshipId }),
      });
      const data = (await res.json()) as {
        tracking?: Tracking[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not remove that watch.");
        return;
      }
      setTracking(data.tracking ?? []);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setRemovingId(null);
    }
  }

  function startEditPhone() {
    if (!user) return;
    setPhoneDraft(formatPhoneDisplay(user.phone));
    setEditingPhone(true);
    setError(null);
  }

  function cancelEditPhone() {
    setEditingPhone(false);
    setPhoneDraft("");
    setError(null);
  }

  async function savePhone() {
    if (!user) return;
    setSavingPhone(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/phone", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneDraft }),
      });
      const data = (await res.json()) as {
        user?: AccountUser;
        error?: string;
      };
      if (!res.ok || !data.user) {
        setError(data.error ?? "Could not update your number.");
        return;
      }
      setUser(data.user);
      setEditingPhone(false);
      setPhoneDraft("");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSavingPhone(false);
    }
  }

  async function logOut() {
    setLoggingOut(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) {
        setError("Could not log out. Try again.");
        return;
      }
      notifyAuthChanged();
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  const grouped = useMemo(() => {
    const unique = dedupeByCompanyRole(tracking);
    const map = new Map<string, Tracking[]>();
    for (const item of unique) {
      const list = map.get(item.company) ?? [];
      list.push(item);
      map.set(item.company, list);
    }
    return Array.from(map.entries())
      .map(([company, roles]) => ({
        company,
        roles: roles.sort((a, b) => a.title.localeCompare(b.title)),
      }))
      .sort((a, b) => a.company.localeCompare(b.company));
  }, [tracking]);

  if (loading) {
    return (
      <div className="auth-panel">
        <h1>Loading…</h1>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-panel">
        <h1>Couldn’t load account</h1>
        {error ? <p className="form-error">{error}</p> : null}
        <a className="cta" href="/login">
          Log In
        </a>
      </div>
    );
  }

  return (
    <div className="auth-panel account-panel">
      <h1>Welcome, {firstName(user.name)}</h1>
      <div className="account-phone-row">
        {editingPhone ? (
          <>
            <span className="account-phone-emoji" aria-hidden="true">
              📞
            </span>
            <input
              className="account-phone-input"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={phoneDraft}
              onChange={(e) => setPhoneDraft(e.target.value)}
              disabled={savingPhone}
              aria-label="Phone number"
            />
            <button
              type="button"
              className="account-phone-btn"
              disabled={savingPhone || !phoneDraft.trim()}
              onClick={savePhone}
            >
              {savingPhone ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              className="account-phone-btn is-ghost"
              disabled={savingPhone}
              onClick={cancelEditPhone}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <span className="account-phone-display">
              <span aria-hidden="true">📞</span> {formatPhoneDisplay(user.phone)}
            </span>
            <button
              type="button"
              className="account-phone-btn"
              onClick={startEditPhone}
            >
              Change
            </button>
            <button
              type="button"
              className="account-phone-btn is-ghost"
              disabled={loggingOut}
              onClick={logOut}
            >
              {loggingOut ? "Logging out…" : "Log out"}
            </button>
          </>
        )}
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      {MONETIZATION_ENABLED ? (
        <section className="account-plan-banner">
          {plan?.hasSeasonPass ? (
            <p>
              Season pass active through{" "}
              {formatSeasonPassExpiry(plan.seasonPassExpiresAt ?? undefined)}.
              Unlimited companies.
            </p>
          ) : (
            <p>
              Free plan: {grouped.length}/
              {plan?.freeCompanyLimit ?? FREE_COMPANY_LIMIT} companies.{" "}
              <a href={`${UPGRADE_PATH}?reason=limit`}>
                Unlock unlimited for $10
              </a>
            </p>
          )}
        </section>
      ) : null}

      <section className="account-list-section">
        <div className="account-list-head">
          <h2>My Watchlist</h2>
          <div className="account-list-meta">
            {!MONETIZATION_ENABLED ||
            plan?.hasSeasonPass ||
            grouped.length < (plan?.freeCompanyLimit ?? FREE_COMPANY_LIMIT) ? (
              <a href="/signup?add=1">Add More</a>
            ) : (
              <a href={`${UPGRADE_PATH}?reason=limit`}>Upgrade</a>
            )}
          </div>
        </div>

        {grouped.length === 0 ? (
          <p className="fineprint">
            No active watches yet.{" "}
            <a href="/signup">Pick roles to track</a>.
          </p>
        ) : (
          <table className="account-table">
            <thead>
              <tr>
                <th scope="col">Company</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {grouped.map(({ company, roles }) =>
                roles.map((item, index) => {
                  const isOpen = item.status === "open";
                  const roleLabel = roleBaseTitle(item.title);
                  return (
                    <tr
                      key={`${item.company}-${roleLabel}-${item.id}`}
                      className={index === 0 ? "is-company-start" : undefined}
                    >
                      <td className="account-table-company">
                        {index === 0 ? (
                          <span className="account-company-cell">
                            <CompanyLogo company={company} />
                            <span>{company}</span>
                          </span>
                        ) : null}
                      </td>
                      <td className="account-table-role">{roleLabel}</td>
                      <td className="account-table-status-cell">
                        <span
                          className={`account-table-status is-${isOpen ? "open" : "waiting"}`}
                        >
                          {trackerStatusLabel(item)}
                        </span>
                      </td>
                      <td className="account-table-action">
                        <button
                          type="button"
                          className="account-trash"
                          disabled={removingId === item.id}
                          aria-label={`Remove ${roleLabel}`}
                          title="Remove"
                          onClick={() => removeWatch(item.id)}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="15"
                            height="15"
                            aria-hidden="true"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M4 7h16" />
                            <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            <path d="M7 7l1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        )}
        {grouped.length > 0 ? (
          <div className="account-add-company">
            {!MONETIZATION_ENABLED ||
            plan?.hasSeasonPass ||
            grouped.length < (plan?.freeCompanyLimit ?? FREE_COMPANY_LIMIT) ? (
              <a href="/signup?add=1">+ Add another company</a>
            ) : (
              <a href={`${UPGRADE_PATH}?reason=limit`}>
                + Unlock more companies ($10 season pass)
              </a>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
