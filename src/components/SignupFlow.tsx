"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { companyLogoUrl } from "@/lib/company-logos";
import {
  companyDropLabel,
  companyDropStatus,
  companyHasTrackableRoles,
  isRoleOpenForApply,
  isRoleTrackable,
} from "@/lib/company-status";
import { isDirectApplyUrl } from "@/lib/apply-url";
import {
  DEFAULT_TIMELINE,
  dedupeByCompanyRole,
  roleBaseTitle,
  TIMELINES,
  timelineMatches,
} from "@/lib/role-meta";
import { FREE_COMPANY_LIMIT, MONETIZATION_ENABLED, UPGRADE_PATH } from "@/lib/limits";
import { formatPhoneDisplay } from "@/lib/phone";
import { wouldExceedFreeCompanyLimit } from "@/lib/season-pass";
import { notifyAuthChanged } from "@/components/SiteNav";
import { notifySignupFromBrowser } from "@/lib/ops-notify-browser";

export type InternshipOption = {
  id: string;
  company: string;
  title: string;
  slug: string;
  description: string | null;
  status: string;
  sourceType: string;
  applyUrl: string | null;
  openedAt: string | null;
  logoUrl?: string | null;
};

type Props = {
  initialInternships: InternshipOption[];
  initialSession?: {
    name: string;
    phone: string;
    tracking: Array<{ company: string; title: string }>;
  } | null;
};

type Step = "contact" | "company" | "roles" | "success";

function CompanyLogo({
  company,
  logoUrl,
}: {
  company: string;
  logoUrl?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const src = companyLogoUrl(company, logoUrl);
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

export function SignupFlow({
  initialInternships,
  initialSession = null,
}: Props) {
  const searchParams = useSearchParams();
  const addingMore = searchParams.get("add") === "1";
  const [internships, setInternships] = useState(initialInternships);
  const [step, setStep] = useState<Step>("company");
  const [activeCompany, setActiveCompany] = useState<string | null>(null);
  const [companyQuery, setCompanyQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [roleKeys, setRoleKeys] = useState<Set<string>>(new Set());
  const timelines = useMemo(
    () => new Set([DEFAULT_TIMELINE]),
    [],
  );
  const [name, setName] = useState(initialSession?.name ?? "");
  const [phone, setPhone] = useState(
    initialSession?.phone ? formatPhoneDisplay(initialSession.phone) : "",
  );
  const [smsConsent, setSmsConsent] = useState(Boolean(initialSession));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestCompany, setRequestCompany] = useState("");
  const [requestRoles, setRequestRoles] = useState("");
  const [requestStatus, setRequestStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [tracking, setTracking] = useState<
    Array<{ company: string; title: string }>
  >(initialSession?.tracking ?? []);
  const [hasSeasonPass, setHasSeasonPass] = useState(false);

  const hasExistingTracking =
    addingMore || tracking.length > 0 || Boolean(initialSession?.tracking.length);

  // Resume session + plan when logged in (Add More or after signup).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (data: {
          user?: {
            name?: string;
            phone?: string;
            hasSeasonPass?: boolean;
          };
          plan?: { hasSeasonPass?: boolean };
          tracking?: Array<{
            company: string;
            title: string;
            status?: string;
            openedAt?: string | null;
          }>;
        } | null) => {
          if (cancelled || !data?.user) return;
          notifyAuthChanged();
          setHasSeasonPass(
            Boolean(data.user.hasSeasonPass) ||
              Boolean(data.plan?.hasSeasonPass),
          );
          if (data.user.name) setName(data.user.name);
          if (data.user.phone) setPhone(formatPhoneDisplay(data.user.phone));
          setSmsConsent(true);
          if (Array.isArray(data.tracking) && data.tracking.length > 0) {
            setTracking(
              dedupeByCompanyRole(
                data.tracking.map((t) => ({
                  company: t.company,
                  title: t.title,
                })),
              ),
            );
          }
        },
      )
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [addingMore]);

  // Refresh internship open status so timers start when a listing flips open.
  useEffect(() => {
    if (step !== "company" && step !== "roles") return;

    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch("/api/internships", { cache: "no-store" });
        const data = await res.json();
        if (cancelled || !Array.isArray(data.internships)) return;
        setInternships(
          data.internships.map(
            (i: {
              id: string;
              company: string;
              title: string;
              slug: string;
              description: string | null;
              status: string;
              sourceType: string;
              applyUrl: string | null;
              openedAt?: string | null;
              logoUrl?: string | null;
            }) => ({
              id: i.id,
              company: i.company,
              title: i.title,
              slug: i.slug,
              description: i.description,
              status: i.status,
              sourceType: i.sourceType,
              applyUrl: i.applyUrl,
              openedAt: i.openedAt ?? null,
              logoUrl: i.logoUrl ?? null,
            }),
          ),
        );
      } catch {
        // ignore transient poll errors
      }
    }

    refresh();
    const id = window.setInterval(refresh, 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [step]);

  // When a watched role flips open, drop it from selection (it moves to Apply Now).
  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set(prev);
      let changed = false;
      for (const item of internships) {
        if (!next.has(item.id)) continue;
        if (!isRoleOpenForApply(item.company, item)) continue;
        next.delete(item.id);
        changed = true;
      }
      return changed ? next : prev;
    });

    if (!activeCompany) return;
    const roles = internships.filter((i) => i.company === activeCompany);
    if (companyHasTrackableRoles(activeCompany, roles)) return;
    setActiveCompany(null);
    setRoleKeys(new Set());
    if (step === "roles") {
      setStep("company");
      setError(
        "That company just opened — find it under Apply Now for direct links.",
      );
    }
  }, [internships, activeCompany, step]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    fetch("/api/internships", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (
          cancelled ||
          !Array.isArray(data.internships) ||
          data.internships.length === 0
        ) {
          return;
        }
        setInternships(
          data.internships.map(
            (i: {
              id: string;
              company: string;
              title: string;
              slug: string;
              description: string | null;
              status: string;
              sourceType: string;
              applyUrl?: string | null;
              openedAt?: string | null;
              logoUrl?: string | null;
            }) => ({
              id: i.id,
              company: i.company,
              title: i.title,
              slug: i.slug,
              description: i.description,
              status: i.status,
              sourceType: i.sourceType,
              applyUrl: i.applyUrl ?? null,
              openedAt: i.openedAt ?? null,
              logoUrl: i.logoUrl ?? null,
            }),
          ),
        );
      })
      .catch(() => {})
      .finally(() => clearTimeout(timer));

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, InternshipOption[]>();
    for (const item of internships) {
      const list = map.get(item.company) ?? [];
      list.push(item);
      map.set(item.company, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );
  }, [internships]);

  const logoByCompany = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of internships) {
      if (item.logoUrl && !map.has(item.company)) {
        map.set(item.company, item.logoUrl);
      }
    }
    return map;
  }, [internships]);

  const selectedByCompany = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of internships) {
      if (!selected.has(item.id)) continue;
      if (isRoleOpenForApply(item.company, item)) continue;
      counts.set(item.company, (counts.get(item.company) ?? 0) + 1);
    }
    return counts;
  }, [internships, selected]);

  const filteredCompanies = useMemo(() => {
    const available = grouped.filter(([company, roles]) => {
      if (!companyHasTrackableRoles(company, roles)) return false;
      return true;
    });
    const q = companyQuery.trim().toLowerCase();
    if (!q) return available;
    return available.filter(([company, roles]) => {
      if (company.toLowerCase().includes(q)) return true;
      return roles.some(
        (role) =>
          role.title.toLowerCase().includes(q) ||
          role.slug.toLowerCase().includes(q),
      );
    });
  }, [grouped, companyQuery]);

  const companyRoles = useMemo(() => {
    if (!activeCompany) return [];
    return internships.filter((i) => i.company === activeCompany);
  }, [internships, activeCompany]);

  const trackableCompanyRoles = useMemo(() => {
    if (!activeCompany) return [];
    return companyRoles.filter((role) =>
      isRoleTrackable(activeCompany, role),
    );
  }, [activeCompany, companyRoles]);

  const uniqueRoleKeys = useMemo(() => {
    const keys: string[] = [];
    const seen = new Set<string>();
    for (const role of trackableCompanyRoles) {
      const key = roleBaseTitle(role.title);
      if (seen.has(key)) continue;
      seen.add(key);
      keys.push(key);
    }
    return keys;
  }, [trackableCompanyRoles]);

  const companiesTracked = useMemo(
    () => Array.from(selectedByCompany.keys()),
    [selectedByCompany],
  );

  const openApplyRoles = useMemo(() => {
    if (!activeCompany) return [];
    return dedupeByCompanyRole(
      companyRoles.filter(
        (role) =>
          isRoleOpenForApply(activeCompany, role) &&
          isDirectApplyUrl(role.applyUrl),
      ),
    );
  }, [activeCompany, companyRoles]);

  const trackedCompanies = useMemo(() => {
    const companies = new Set(tracking.map((t) => t.company));
    for (const id of selected) {
      const row = internships.find((i) => i.id === id);
      if (row?.company) companies.add(row.company);
    }
    return companies;
  }, [tracking, selected, internships]);

  const atFreeCompanyLimit =
    MONETIZATION_ENABLED &&
    !hasSeasonPass &&
    trackedCompanies.size >= FREE_COMPANY_LIMIT;

  function syncRoleKeysForCompany(company: string, base: Set<string>) {
    const roles = internships.filter(
      (i) => i.company === company && isRoleTrackable(company, i),
    );
    return new Set(
      roles.filter((r) => base.has(r.id)).map((r) => roleBaseTitle(r.title)),
    );
  }

  function openCompany(company: string) {
    if (
      MONETIZATION_ENABLED &&
      !hasSeasonPass &&
      !trackedCompanies.has(company) &&
      trackedCompanies.size >= FREE_COMPANY_LIMIT &&
      !selectedByCompany.has(company)
    ) {
      window.location.assign(`${UPGRADE_PATH}?reason=limit`);
      return;
    }

    setError(null);

    // Toggle accordion on the company list (no separate roles page).
    if (activeCompany === company && step === "company") {
      setActiveCompany(null);
      setRoleKeys(new Set());
      return;
    }

    setActiveCompany(company);
    setRoleKeys(syncRoleKeysForCompany(company, selected));
    if (step !== "company") setStep("company");
  }

  function applyRoleKeysToCompany(company: string, keys: Set<string>) {
    const roles = internships.filter(
      (i) => i.company === company && isRoleTrackable(company, i),
    );
    const next = buildSelectionForCompany(selected, roles, keys);
    const nextCompanies = internships
      .filter((i) => next.has(i.id))
      .map((i) => i.company);
    if (
      MONETIZATION_ENABLED &&
      wouldExceedFreeCompanyLimit({
        existingCompanies: trackedCompanies,
        nextCompanies: [...trackedCompanies, ...nextCompanies],
        hasPass: hasSeasonPass,
      })
    ) {
      window.location.assign(`${UPGRADE_PATH}?reason=limit`);
      return;
    }
    setRoleKeys(keys);
    setSelected(next);
    setError(null);
  }

  function toggleRoleKeyInline(key: string) {
    if (!activeCompany) return;
    const nextKeys = new Set(roleKeys);
    if (nextKeys.has(key)) nextKeys.delete(key);
    else nextKeys.add(key);
    applyRoleKeysToCompany(activeCompany, nextKeys);
  }

  function toggleSelectAllInline(keys: string[]) {
    if (!activeCompany) return;
    const allSelected =
      roleKeys.size === keys.length && keys.length > 0;
    applyRoleKeysToCompany(
      activeCompany,
      allSelected ? new Set() : new Set(keys),
    );
  }

  async function submitCompanyRequest(e: FormEvent) {
    e.preventDefault();
    const company = requestCompany.trim();
    if (!company) {
      setRequestError("Enter a company name.");
      setRequestStatus("error");
      return;
    }

    setRequestError(null);
    setRequestStatus("sending");

    const roles = requestRoles.trim() || undefined;
    const contact = phone.trim() || name.trim() || undefined;
    const payload = { company, roles, contact };
    const message = [
      "RadarApply — company add request",
      `Company: ${company}`,
      `Roles: ${roles || "(not specified)"}`,
      contact ? `Contact: ${contact}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      // FormSubmit from the browser (server IPs get Cloudflare-blocked).
      const formRes = await fetch(
        "https://formsubmit.co/ajax/radarapply@gmail.com",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            _subject: `Company request: ${company}`,
            _template: "box",
            _captcha: "false",
            Company: company,
            Roles: roles || "(not specified)",
            Contact: contact || "(none)",
            message,
          }),
        },
      );
      const formBody = await formRes.text();
      let formOk = formRes.ok;
      try {
        const parsed = JSON.parse(formBody) as {
          success?: string | boolean;
        };
        formOk =
          formOk &&
          parsed.success !== false &&
          parsed.success !== "false";
      } catch {
        // non-JSON success body is fine
      }

      if (!formOk) {
        // Last resort: our API (DB + email) — may still work if Resend is set.
        const res = await fetch("/api/company-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          setRequestError("Could not send request. Try again in a moment.");
          setRequestStatus("error");
          return;
        }
      } else {
        // Best-effort store/notify via API; ignore failures.
        void fetch("/api/company-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setRequestCompany("");
      setRequestRoles("");
      setRequestStatus("sent");
    } catch {
      setRequestError("Network error. Try again.");
      setRequestStatus("error");
    }
  }

  function toggleRoleKey(key: string) {
    setRoleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function preferRole(a: InternshipOption, b: InternshipOption) {
    const score = (role: InternshipOption) =>
      (isDirectApplyUrl(role.applyUrl) ? 1 : 0);
    return score(b) - score(a);
  }

  function buildSelectionForCompany(
    base: Set<string>,
    roles: InternshipOption[],
    keys: Set<string>,
  ) {
    const next = new Set(base);
    for (const role of roles) {
      next.delete(role.id);
    }

    // One internship ID per role chip — never subscribe twice to the same position.
    const bestByKey = new Map<string, InternshipOption>();
    for (const role of roles) {
      if (!isRoleTrackable(role.company, role)) continue;
      const key = roleBaseTitle(role.title);
      if (!keys.has(key)) continue;
      if (!timelineMatches(role.title, timelines)) continue;
      const existing = bestByKey.get(key);
      if (!existing || preferRole(existing, role) > 0) {
        bestByKey.set(key, role);
      }
    }
    for (const role of bestByKey.values()) {
      next.add(role.id);
    }
    return next;
  }

  async function finishSignup(internshipIds: Set<string>) {
    setError(null);

    if (internshipIds.size === 0) {
      setError("Pick at least one internship to track.");
      return;
    }
    if (!smsConsent) {
      setError("Check the box to agree to receive RadarApply SMS alerts.");
      return;
    }
    if (Array.from(internshipIds).some((id) => id.startsWith("catalog-"))) {
      setError("Still loading live listings — wait a second and try again.");
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
          internshipIds: Array.from(internshipIds),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        loginRequired?: boolean;
        upgradeRequired?: boolean;
        isNewUser?: boolean;
        emailSent?: boolean;
        tracking?: Array<{ company: string; title: string }>;
        user?: { hasSeasonPass?: boolean };
      };
      if (!res.ok) {
        if (data.loginRequired) {
          const params = new URLSearchParams({
            from: "signup",
            phone: phone.trim(),
          });
          window.location.assign(`/login?${params.toString()}`);
          return;
        }
        if (data.upgradeRequired || res.status === 402) {
          window.location.assign(`${UPGRADE_PATH}?reason=limit`);
          return;
        }
        setError(data.error ?? "Something went wrong.");
        return;
      }
      if (typeof data.user?.hasSeasonPass === "boolean") {
        setHasSeasonPass(data.user.hasSeasonPass);
      }
      notifyAuthChanged();

      const alerts = dedupeByCompanyRole(
        (data.tracking ?? []).map((t) => ({
          company: t.company,
          title: t.title,
        })),
      );
      // One signup email: browser FormSubmit only when server did not send (Resend).
      if (data.isNewUser && !data.emailSent) {
        void notifySignupFromBrowser({
          name: name.trim(),
          phone: phone.trim(),
          alerts,
          isNewUser: true,
        });
      }

      setSelected(internshipIds);
      setTracking(alerts);
      setActiveCompany(null);
      setCompanyQuery("");
      setStep("success");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function applyCompanySelection() {
    if (!activeCompany) return;
    if (roleKeys.size === 0) {
      setError("Pick at least one position.");
      return;
    }

    const next = buildSelectionForCompany(
      selected,
      trackableCompanyRoles,
      roleKeys,
    );

    const nextCompanies = internships
      .filter((i) => next.has(i.id))
      .map((i) => i.company);
    if (
      MONETIZATION_ENABLED &&
      wouldExceedFreeCompanyLimit({
        existingCompanies: trackedCompanies,
        nextCompanies: [...trackedCompanies, ...nextCompanies],
        hasPass: hasSeasonPass,
      })
    ) {
      window.location.assign(`${UPGRADE_PATH}?reason=limit`);
      return;
    }

    setSelected(next);
    setRoleKeys(new Set());
    setActiveCompany(null);
    setError(null);
    // Stay on company list so more firms can be added before one submit.
    setStep("company");
  }

  function removeCompanySelection(company: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const item of internships) {
        if (item.company === company) next.delete(item.id);
      }
      return next;
    });
    setError(null);
  }

  async function continueFromCompanyList() {
    if (companiesTracked.length === 0) {
      setError("Add at least one company first.");
      return;
    }
    setError(null);

    // Logged-in / returning users already have contact + consent.
    if (name.trim() && phone.trim() && smsConsent) {
      await finishSignup(selected);
      return;
    }

    setStep("contact");
  }

  function goToApplyNow() {
    window.location.href = "/open";
  }

  async function submitContact(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Enter your name.");
      return;
    }
    if (!phone.trim()) {
      setError("Enter your phone number.");
      return;
    }
    if (!smsConsent) {
      setError("Check the box to agree to receive RadarApply SMS alerts.");
      return;
    }
    if (selected.size === 0) {
      setError("Pick at least one internship to track.");
      return;
    }

    await finishSignup(selected);
  }

  function trackMoreCompanies() {
    setActiveCompany(null);
    setCompanyQuery("");
    setError(null);
    setStep("company");
  }

  if (step === "success") {
    const lockedInName = name.trim().split(/\s+/)[0] || "there";
    return (
      <div className="success-panel" role="status">
        <p className="success-kicker">
          You&apos;re locked in, {lockedInName}. 🔐
        </p>
        <h2 className="success-title">We&apos;ll text you as soon as it opens.</h2>
        <p className="success-copy">
          RadarApply is watching your list. The moment a listing flips open,
          <br />
          your phone gets the alert — because emails are outdated.
        </p>
        <div className="success-actions">
          {atFreeCompanyLimit ? (
            <a
              className="success-action-btn is-primary"
              href={`${UPGRADE_PATH}?reason=limit`}
            >
              Unlock unlimited — $10 season pass
            </a>
          ) : (
            <button
              className="success-action-btn is-primary"
              type="button"
              onClick={trackMoreCompanies}
            >
              Add More Companies
            </button>
          )}
          <a className="success-action-btn is-secondary" href="/account">
            My Watchlist
          </a>
        </div>
      </div>
    );
  }

  if (step === "roles" && activeCompany) {
    const isAlreadyOpen = trackableCompanyRoles.length === 0;
    const dropStatus = isAlreadyOpen
      ? "open"
      : companyDropStatus(
          activeCompany,
          trackableCompanyRoles.map((r) => ({
            status: r.status,
            openedAt: r.openedAt,
          })),
        );

    return (
      <div className="signup-flow">
        <button
          type="button"
          className="signup-back"
          onClick={() => {
            setStep("company");
            setActiveCompany(null);
            setRoleKeys(new Set());
            setError(null);
          }}
        >
          ← Back
        </button>
        <div className="signup-flow-head">
          <div className="signup-flow-company">
            <div className="signup-flow-company-row">
              <div className="signup-flow-company-left">
                <CompanyLogo
                  company={activeCompany}
                  logoUrl={logoByCompany.get(activeCompany)}
                />
                <h1>{activeCompany}</h1>
              </div>
              <p
                className={`signup-flow-status company-drop-status is-${dropStatus}`}
              >
                <span className="signup-flow-status-label">status:</span>{" "}
                {companyDropLabel(activeCompany, trackableCompanyRoles)}
              </p>
            </div>
          </div>
          <p className="signup-flow-sub">
            {isAlreadyOpen
              ? "These applications are live — apply from Apply Now."
              : "Choose the positions you want to watch."}
          </p>
        </div>

        <section className="signup-pick">
          <h2>Term</h2>
          <div className="chip-grid">
            {TIMELINES.map((t) => (
              <button
                key={t.id}
                type="button"
                className="pick-chip is-active"
                aria-pressed="true"
                disabled
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {isAlreadyOpen && openApplyRoles.length > 0 ? (
          <section className="signup-pick">
            <h2>Apply</h2>
            <div className="apply-link-list">
              {openApplyRoles.map((role) => {
                const href = role.applyUrl!;
                const label = roleBaseTitle(role.title);
                return (
                  <a
                    key={role.id}
                    className="apply-link-btn"
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>{label}</span>
                    <span className="apply-link-arrow" aria-hidden="true">
                      →
                    </span>
                  </a>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="signup-pick">
            <div className="signup-pick-head">
              <h2>Positions</h2>
              {uniqueRoleKeys.length > 1 ? (
                <button
                  type="button"
                  className="role-select-all-btn"
                  onClick={() => {
                    const allSelected =
                      roleKeys.size === uniqueRoleKeys.length &&
                      uniqueRoleKeys.length > 0;
                    setRoleKeys(
                      allSelected ? new Set() : new Set(uniqueRoleKeys),
                    );
                  }}
                >
                  {roleKeys.size === uniqueRoleKeys.length &&
                  uniqueRoleKeys.length > 0
                    ? "Clear all"
                    : "Select all"}
                </button>
              ) : null}
            </div>
            <div className="chip-grid">
              {uniqueRoleKeys.map((key) => {
                const active = roleKeys.has(key);
                return (
                  <button
                    key={key}
                    type="button"
                    className={`pick-chip${active ? " is-active" : ""}`}
                    onClick={() => toggleRoleKey(key)}
                    aria-pressed={active}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {error ? <p className="form-error">{error}</p> : null}

        {isAlreadyOpen && openApplyRoles.length > 0 ? (
          <button
            className="cta"
            type="button"
            onClick={goToApplyNow}
          >
            Go to Apply Now
          </button>
        ) : (
          <button
            className="cta"
            type="button"
            onClick={applyCompanySelection}
            disabled={loading}
          >
            {loading ? "Saving…" : "Add to list"}
          </button>
        )}
      </div>
    );
  }

  if (step === "contact") {
    return (
      <form className="signup-flow signup" onSubmit={submitContact}>
        <button
          type="button"
          className="signup-back"
          onClick={() => {
            setRoleKeys(new Set());
            setActiveCompany(null);
            setError(null);
            setStep("company");
          }}
        >
          ← Back
        </button>
        <div className="signup-flow-head">
          <h1>Where should we send alerts?</h1>
          <p className="signup-flow-sub">
            Enter your name and phone to get texts when your tracked roles open.
          </p>
        </div>

        {companiesTracked.length > 0 ? (
          <ul className="signup-summary">
            {companiesTracked.map((company) => (
              <li key={company}>
                <CompanyLogo
                  company={company}
                  logoUrl={logoByCompany.get(company)}
                />
                <span>
                  {company}
                  <em>
                    {selectedByCompany.get(company)}{" "}
                    {(selectedByCompany.get(company) ?? 0) === 1
                      ? "position"
                      : "positions"}
                  </em>
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="field-row">
          <label className="field">
            <span>Name</span>
            <input
              required
              autoComplete="name"
              placeholder="John Doe"
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
              onChange={(e) => {
                setPhone(e.target.value);
                setError(null);
              }}
            />
          </label>
        </div>

        <div className="sms-consent">
          <p className="sms-consent-lead">
            RadarApply is an SMS alert program for internship and job
            application openings you choose to track.
          </p>
          <label className="consent-check">
            <input
              type="checkbox"
              checked={smsConsent}
              onChange={(e) => setSmsConsent(e.target.checked)}
            />
            <span>
              I agree to receive automated SMS notifications from RadarApply at
              the mobile number provided about internship application alerts for
              tracked internship applications I choose to monitor (including
              company, role title, and apply link), plus optional test messages
              if I request them. Message frequency varies depending on the
              internships and job opportunities I choose to track and when those
              applications become available. Message and data rates may apply.
              Reply STOP at any time to unsubscribe. Reply HELP for customer
              support. Consent to receive SMS messages is not a condition of
              purchase. Terms:{" "}
              <a href="https://www.radarapply.com/terms" target="_blank" rel="noreferrer">
                https://www.radarapply.com/terms
              </a>
              . Privacy:{" "}
              <a href="https://www.radarapply.com/privacy" target="_blank" rel="noreferrer">
                https://www.radarapply.com/privacy
              </a>
              .
            </span>
          </label>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="cta" type="submit" disabled={loading}>
          {loading ? "Signing Up…" : "Start Tracking"}
        </button>
        <p className="fineprint">
          By continuing, you confirm this mobile number is yours and that you
          checked the box to opt in to RadarApply SMS alerts.
        </p>
      </form>
    );
  }

  // company step
  return (
    <div className="signup-flow">
      <button
        type="button"
        className="signup-back"
        onClick={() => {
          setError(null);
          if (addingMore) {
            window.location.assign("/account");
            return;
          }
          if (tracking.length > 0) {
            setStep("success");
            return;
          }
          window.location.assign("/");
        }}
      >
        ← Back
      </button>
      <div className="signup-flow-head">
        <h1>
          {hasExistingTracking
            ? "Track more companies"
            : "Choose companies to track"}
        </h1>
        <p className="signup-flow-sub">
          {hasExistingTracking
            ? "Tap a company to pick roles. Add as many as you want, then save once."
            : "Tap a company to pick roles, then continue once."}
        </p>
      </div>

      <label className="company-search">
        <span className="sr-only">Search companies</span>
        <input
          type="search"
          value={companyQuery}
          onChange={(e) => setCompanyQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          placeholder="Search companies…"
          autoComplete="off"
          enterKeyHint="search"
          autoFocus
        />
      </label>

      <div className="company-list signup-company-list">
        {filteredCompanies.length === 0 ? (
          <p className="company-empty">
            {companyQuery.trim()
              ? `No companies match “${companyQuery.trim()}”.`
              : "No companies available."}
          </p>
        ) : (
          filteredCompanies.map(([company, roles]) => {
            const isOpen = activeCompany === company;
            const count = selectedByCompany.get(company) ?? 0;
            const trackable = roles.filter((role) =>
              isRoleTrackable(company, role),
            );
            const keys: string[] = [];
            const seen = new Set<string>();
            for (const role of trackable) {
              const key = roleBaseTitle(role.title);
              if (seen.has(key)) continue;
              seen.add(key);
              keys.push(key);
            }

            return (
              <div
                key={company}
                className={`company-row${isOpen ? " is-open" : ""}${
                  count > 0 ? " has-selection" : ""
                }`}
              >
                <button
                  type="button"
                  className="company-toggle"
                  onClick={() => openCompany(company)}
                  aria-expanded={isOpen}
                >
                  <span className="company-toggle-left">
                    <CompanyLogo
                      company={company}
                      logoUrl={logoByCompany.get(company)}
                    />
                    <span className="company-toggle-text">
                      <span className="company-toggle-name">{company}</span>
                    </span>
                  </span>
                  <span className="company-toggle-meta">
                    {count > 0 ? (
                      <span className="company-count">
                        {count} {count === 1 ? "role" : "roles"}
                      </span>
                    ) : null}
                    <span className="company-chevron" aria-hidden="true" />
                  </span>
                </button>
                {isOpen ? (
                  <div className="role-menu">
                    {keys.length > 1 ? (
                      <label className="role-all">
                        <input
                          type="checkbox"
                          checked={
                            roleKeys.size === keys.length && keys.length > 0
                          }
                          ref={(el) => {
                            if (el) {
                              el.indeterminate =
                                roleKeys.size > 0 &&
                                roleKeys.size < keys.length;
                            }
                          }}
                          onChange={() => toggleSelectAllInline(keys)}
                        />
                        <span>Select all</span>
                      </label>
                    ) : null}
                    {keys.map((key) => {
                      const active = roleKeys.has(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`role-item${active ? " is-active" : ""}`}
                          onClick={() => toggleRoleKeyInline(key)}
                          aria-pressed={active}
                        >
                          <span className="role-check" aria-hidden="true" />
                          <span className="role-title">{key}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <form className="company-request" onSubmit={submitCompanyRequest}>
        <h2 className="company-request-title">
          Don&apos;t see the company you want?
        </h2>
        <p className="company-request-sub">
          Request for us to add it here.
        </p>
        <label className="field">
          <span>Company</span>
          <input
            value={requestCompany}
            onChange={(e) => {
              setRequestCompany(e.target.value);
              if (requestStatus === "sent") setRequestStatus("idle");
            }}
            placeholder="e.g. Bloomberg"
            maxLength={120}
            autoComplete="organization"
            required
          />
        </label>
        <label className="field">
          <span>Roles (optional)</span>
          <input
            value={requestRoles}
            onChange={(e) => setRequestRoles(e.target.value)}
            placeholder="e.g. SWE intern, quant research"
            maxLength={500}
          />
        </label>
        <button
          type="submit"
          className="btn-ghost company-request-submit"
          disabled={requestStatus === "sending"}
        >
          {requestStatus === "sending" ? "Sending…" : "Submit request"}
        </button>
        {requestStatus === "sent" ? (
          <p className="company-request-success">
            Got it — we’ll review adding that company.
          </p>
        ) : null}
        {requestStatus === "error" && requestError ? (
          <p className="form-error">{requestError}</p>
        ) : null}
      </form>

      {error ? <p className="form-error">{error}</p> : null}

      {companiesTracked.length > 0 ? (
        <div className="signup-multi-bar">
          <p className="signup-multi-bar-copy">
            {companiesTracked.length}{" "}
            {companiesTracked.length === 1 ? "company" : "companies"} ·{" "}
            {selected.size} {selected.size === 1 ? "role" : "roles"} selected
          </p>
          <button
            className="cta"
            type="button"
            onClick={continueFromCompanyList}
            disabled={loading}
          >
            {loading
              ? "Saving…"
              : name.trim() && phone.trim() && smsConsent
                ? "Save all"
                : "Continue"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
