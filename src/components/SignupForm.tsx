"use client";

import { FormEvent, useMemo, useState } from "react";

export type InternshipOption = {
  id: string;
  company: string;
  title: string;
  slug: string;
  description: string | null;
  status: string;
  sourceType: string;
};

type Props = {
  internships: InternshipOption[];
};

type Phase = "form" | "success";

export function SignupForm({ internships }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const [tracking, setTracking] = useState<
    Array<{ company: string; title: string }>
  >([]);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, InternshipOption[]>();
    for (const item of internships) {
      const list = map.get(item.company) ?? [];
      list.push(item);
      map.set(item.company, list);
    }
    return Array.from(map.entries());
  }, [internships]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (selected.size === 0) {
      setError("Pick at least one internship to track.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          internshipIds: Array.from(selected),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setTracking(data.tracking ?? []);
      setPhase("success");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function sendTestText() {
    setTesting(true);
    setTestStatus(null);
    try {
      const res = await fetch("/api/demo/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "droptext-demo" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTestStatus(data.error ?? "Couldn’t send the test text.");
        return;
      }
      if (data.sent > 0) {
        setTestStatus(
          "Sent — check your phone. (On Twilio trial, the text may use Twilio’s sample wording.)",
        );
      } else if (data.subscribers === 0) {
        setTestStatus(
          "No text sent. Make sure you selected DropText Demo when signing up.",
        );
      } else if (data.errors?.length) {
        setTestStatus(data.errors[0]);
      } else {
        setTestStatus("Text failed to send. Check your Twilio setup.");
      }
    } catch {
      setTestStatus("Network error. Refresh and try again.");
    } finally {
      setTesting(false);
    }
  }

  if (phase === "success") {
    return (
      <div className="success-panel" role="status">
        <p className="success-kicker">You&apos;re locked in</p>
        <h2 className="success-title">We&apos;ll text you the second it opens.</h2>
        <p className="success-copy">
          DropText is watching your list on a 1-second loop. The moment a
          listing flips open, your phone gets the alert — not five minutes later.
        </p>
        <ul className="success-list">
          {tracking.map((t) => (
            <li key={`${t.company}-${t.title}`}>
              <span>{t.company}</span>
              <span>{t.title}</span>
            </li>
          ))}
        </ul>
        <button
          className="cta"
          type="button"
          onClick={sendTestText}
          disabled={testing}
          style={{ marginTop: "1.25rem" }}
        >
          {testing ? "Sending…" : "Send me a test text"}
        </button>
        {testStatus ? <p className="fineprint">{testStatus}</p> : null}
      </div>
    );
  }

  return (
    <form className="signup" onSubmit={onSubmit} id="signup">
      <div className="field-row">
        <label className="field">
          <span>Name</span>
          <input
            required
            autoComplete="name"
            placeholder="Alex Chen"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Phone</span>
          <input
            required
            autoComplete="tel"
            inputMode="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
      </div>

      <fieldset className="track-fieldset">
        <legend>
          Internships to track
          <span className="legend-meta">{selected.size} selected</span>
        </legend>
        <div className="track-grid">
          {grouped.map(([company, roles]) =>
            roles.map((role) => {
              const active = selected.has(role.id);
              return (
                <button
                  key={role.id}
                  type="button"
                  className={`track-item${active ? " is-active" : ""}`}
                  onClick={() => toggle(role.id)}
                  aria-pressed={active}
                >
                  <span className="track-company">{company}</span>
                  <span className="track-title">{role.title}</span>
                  <span className="track-meta">
                    {role.sourceType === "manual" ? "demo" : role.sourceType}
                    {role.status === "open" ? " · open now" : ""}
                  </span>
                </button>
              );
            }),
          )}
        </div>
      </fieldset>

      {error ? <p className="form-error">{error}</p> : null}

      <button className="cta" type="submit" disabled={loading}>
        {loading ? "Arming alerts…" : "Get instant texts"}
      </button>
      <p className="fineprint">
        Standard SMS rates may apply. One text per opening — the second it drops.
      </p>
    </form>
  );
}
