"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { notifyAuthChanged } from "@/components/SiteNav";

type Step = "phone" | "code";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const fromSignup = searchParams.get("from") === "signup";
  const fromUpgrade = searchParams.get("from") === "upgrade";
  const afterLoginPath = fromUpgrade ? "/upgrade" : "/account";

  useEffect(() => {
    const prefill = searchParams.get("phone")?.trim();
    if (prefill) setPhone(prefill);
  }, [searchParams]);

  async function requestCode(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not send a code.");
        return;
      }
      setInfo(data.message ?? "Code sent. Check your texts.");
      setStep("code");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not verify that code.");
        return;
      }
      notifyAuthChanged();
      router.replace(afterLoginPath);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-panel">
      <p className="about-kicker">Welcome back</p>
      <h1>Log In</h1>
      <p className="auth-lead">
        {fromSignup
          ? "This number is already registered. We’ll text a one-time code so you can get back in."
          : fromUpgrade
            ? "Log in with your phone so we can unlock your season pass after checkout."
            : "We’ll text a one-time code to the number you used when you signed up. No password needed."}
      </p>

      {step === "phone" ? (
        <form className="auth-form" onSubmit={requestCode}>
          <label className="field">
            <span>Phone</span>
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              inputMode="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="cta" type="submit" disabled={busy || !phone.trim()}>
            {busy ? "Sending…" : "Text Me A Code"}
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={verifyCode}>
          <label className="field">
            <span>6-digit code</span>
            <input
              type="text"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              required
            />
          </label>
          {info ? <p className="fineprint">{info}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          <button
            className="cta"
            type="submit"
            disabled={busy || code.length !== 6}
          >
            {busy ? "Checking…" : "Log In"}
          </button>
          <button
            type="button"
            className="auth-secondary"
            disabled={busy}
            onClick={() => {
              setStep("phone");
              setCode("");
              setError(null);
              setInfo(null);
            }}
          >
            Use A Different Number
          </button>
        </form>
      )}

      <p className="auth-switch">
        New here? <a href="/signup">Sign Up</a>
      </p>
    </div>
  );
}
