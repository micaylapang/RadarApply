"use client";

import { FormEvent, useEffect, useState } from "react";
import type { SignupReport } from "@/lib/db";
import { formatPhoneDisplay } from "@/lib/phone";

const STORAGE_KEY = "radar_admin_key";

export function AdminSignupsPanel() {
  const [secret, setSecret] = useState("");
  const [draft, setDraft] = useState("");
  const [report, setReport] = useState<SignupReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSecret(saved);
      setDraft(saved);
    }
  }, []);

  useEffect(() => {
    if (!secret) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/signups", {
          headers: { Authorization: `Bearer ${secret}` },
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) {
            setReport(null);
            setError(data.error ?? "Could not load report.");
          }
          return;
        }
        if (!cancelled) setReport(data as SignupReport);
      } catch {
        if (!cancelled) {
          setReport(null);
          setError("Network error. Try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [secret]);

  function unlock(e: FormEvent) {
    e.preventDefault();
    const value = draft.trim();
    if (!value) {
      setError("Enter the admin secret.");
      return;
    }
    window.sessionStorage.setItem(STORAGE_KEY, value);
    setSecret(value);
  }

  function lock() {
    window.sessionStorage.removeItem(STORAGE_KEY);
    setSecret("");
    setDraft("");
    setReport(null);
    setError(null);
  }

  if (!secret) {
    return (
      <div className="admin-panel">
        <p className="about-kicker">Admin</p>
        <h1>Signup report</h1>
        <p className="admin-lead">
          Enter your admin secret to see who signed up and what they&apos;re
          watching.
        </p>
        <form className="admin-unlock" onSubmit={unlock}>
          <label>
            <span className="sr-only">Admin secret</span>
            <input
              type="password"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Admin secret"
              autoComplete="current-password"
            />
          </label>
          <button className="cta" type="submit">
            Unlock
          </button>
        </form>
        {error ? <p className="form-error">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-head">
        <div>
          <p className="about-kicker">Admin</p>
          <h1>Signup report</h1>
        </div>
        <button type="button" className="admin-lock" onClick={lock}>
          Lock
        </button>
      </div>

      {loading && !report ? <p className="admin-lead">Loading…</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      {report ? (
        <>
          <p className="admin-lead">
            {report.totals.users} users · {report.totals.subscriptions}{" "}
            subscriptions
          </p>

          <section className="admin-section">
            <h2>People</h2>
            <ul className="admin-people" role="list">
              {report.users.map((user) => (
                <li key={user.id} className="admin-person">
                  <div className="admin-person-head">
                    <strong>{user.name}</strong>
                    <span>{formatPhoneDisplay(user.phone)}</span>
                    <em>
                      {user.watchCount}{" "}
                      {user.watchCount === 1 ? "watch" : "watches"}
                    </em>
                  </div>
                  {user.watches.length === 0 ? (
                    <p className="admin-empty">No active watches.</p>
                  ) : (
                    <ul className="admin-watch-list" role="list">
                      {user.watches.map((watch) => (
                        <li key={`${user.id}-${watch.company}-${watch.title}`}>
                          <span>{watch.company}</span>
                          <span>{watch.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="admin-section">
            <h2>By company</h2>
            <ul className="admin-counts" role="list">
              {report.byCompany.map((row) => (
                <li key={row.key}>
                  <span>{row.company}</span>
                  <strong>{row.count}</strong>
                </li>
              ))}
            </ul>
          </section>

          <section className="admin-section">
            <h2>By role</h2>
            <ul className="admin-counts" role="list">
              {report.byRole.map((row) => (
                <li key={row.key}>
                  <span>
                    {row.company}
                    <em>{row.title}</em>
                  </span>
                  <strong>{row.count}</strong>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
