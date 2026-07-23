"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { CompanyRequest } from "@/lib/db";
import { parseRequestedRoles, hasListedRoles } from "@/lib/company-request-approve";
import { fetchFormSubmitSubmissions } from "@/lib/company-request-import";
import { formatPhoneDisplay } from "@/lib/phone";

const STORAGE_KEY = "radar_admin_key";
const LOCAL_QUEUE_KEY = "radar_local_company_requests";

type RequestDraft = {
  careersUrl: string;
  rolesText: string;
};

type SignupTotals = {
  users: number;
  subscriptions: number;
};

type LocalCompanyRequest = CompanyRequest & { local?: true };

function readLocalQueue(): LocalCompanyRequest[] {
  try {
    const raw = window.sessionStorage.getItem(LOCAL_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalCompanyRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalQueue(items: LocalCompanyRequest[]) {
  window.sessionStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(items));
}

function formatApproveFlash(
  added: Array<{ title: string; status?: "open" | "closed" }>,
  skipped: Array<{ title: string }> = [],
) {
  const parts: string[] = [];
  if (added.length) {
    const open = added.filter((a) => a.status === "open");
    const monitor = added.filter((a) => a.status !== "open");
    if (open.length) {
      parts.push(`Apply Now: ${open.map((a) => a.title).join(", ")}`);
    }
    if (monitor.length) {
      parts.push(`Monitoring: ${monitor.map((a) => a.title).join(", ")}`);
    }
  }
  if (skipped.length) {
    parts.push(
      `Already tracked (skipped): ${skipped.map((a) => a.title).join(", ")}`,
    );
  }
  if (parts.length === 0) return "Request approved — nothing new to add.";
  return parts.join(" · ");
}

function toLocalRequests(
  items: Array<{
    company: string;
    roles?: string | null;
    contact?: string | null;
    createdAt?: string | null;
  }>,
): LocalCompanyRequest[] {
  const now = Date.now();
  return items
    .filter((i) => i.company?.trim())
    .map((i, idx) => ({
      id: `local-${now}-${idx}-${i.company.trim().toLowerCase().replace(/\s+/g, "-")}`,
      company: i.company.trim(),
      roles: i.roles ?? null,
      contact: i.contact ?? null,
      status: "pending",
      reviewedAt: null,
      reviewNote: null,
      createdAt: i.createdAt || new Date().toISOString(),
      local: true,
    }));
}

function mergeQueues(
  remote: CompanyRequest[],
  local: LocalCompanyRequest[],
): LocalCompanyRequest[] {
  const keys = new Set(
    remote.map(
      (r) =>
        `${r.company.trim().toLowerCase()}|${(r.roles ?? "").trim().toLowerCase()}`,
    ),
  );
  const extras = local.filter((r) => {
    const key = `${r.company.trim().toLowerCase()}|${(r.roles ?? "").trim().toLowerCase()}`;
    return !keys.has(key);
  });
  return [...remote, ...extras];
}

export function AdminSignupsPanel() {
  const [secret, setSecret] = useState("");
  const [draft, setDraft] = useState("");
  const [report, setReport] = useState<SignupTotals | null>(null);
  const [requests, setRequests] = useState<LocalCompanyRequest[]>([]);
  const [drafts, setDrafts] = useState<Record<string, RequestDraft>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formsubmitKey, setFormsubmitKey] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [importing, setImporting] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const hydrateDrafts = useCallback((list: LocalCompanyRequest[]) => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const item of list) {
        if (!next[item.id]) {
          next[item.id] = {
            careersUrl: "",
            rolesText: item.roles ?? "",
          };
        }
      }
      return next;
    });
  }, []);

  const load = useCallback(
    async (key: string) => {
      setLoading(true);
      setError(null);
      try {
        const headers = { Authorization: `Bearer ${key}` };
        const [reqRes, signupRes] = await Promise.all([
          fetch("/api/admin/company-requests?status=pending", {
            headers,
            cache: "no-store",
          }),
          fetch("/api/admin/signups", { headers, cache: "no-store" }),
        ]);

        const reqData = await reqRes.json();
        const signupData = await signupRes.json();
        const local = readLocalQueue();

        if (!reqRes.ok) {
          setRequests(local);
          hydrateDrafts(local);
          if (local.length === 0) {
            setError(reqData.error ?? "Could not load company requests.");
          }
        } else {
          const remote = (reqData.requests ?? []) as CompanyRequest[];
          const merged = mergeQueues(remote, local);
          setRequests(merged);
          hydrateDrafts(merged);
        }

        if (!signupRes.ok) {
          setReport(null);
          setError((e) => e ?? signupData.error ?? "Could not load report.");
        } else {
          setReport((signupData.totals as SignupTotals) ?? null);
        }
      } catch {
        const local = readLocalQueue();
        setReport(null);
        setRequests(local);
        hydrateDrafts(local);
        if (local.length === 0) setError("Network error. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [hydrateDrafts],
  );

  useEffect(() => {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSecret(saved);
      setDraft(saved);
    }
  }, []);

  useEffect(() => {
    if (!secret) return;
    void load(secret);
  }, [secret, load]);

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
    setRequests([]);
    setError(null);
    setFlash(null);
  }

  function removeLocal(id: string) {
    const next = readLocalQueue().filter((r) => r.id !== id);
    writeLocalQueue(next);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  async function review(id: string, action: "approve" | "reject") {
    if (!secret) return;
    setBusyId(id);
    setFlash(null);
    setError(null);
    const local = drafts[id];
    const item = requests.find((r) => r.id === id);
    const isLocal = Boolean(item?.local || id.startsWith("local-"));

    try {
      if (action === "reject") {
        if (isLocal) {
          removeLocal(id);
          setFlash("Request rejected.");
          return;
        }
        const res = await fetch(`/api/admin/company-requests/${id}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "reject" }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not reject request.");
          return;
        }
        setRequests((prev) => prev.filter((r) => r.id !== id));
        setFlash("Request rejected.");
        return;
      }

      // Approve — local queue uses apply endpoint (no company_requests row needed).
      if (isLocal) {
        if (!item) {
          setError("Request not found.");
          return;
        }
        const res = await fetch("/api/admin/company-requests/apply", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            company: item.company,
            rolesText: local?.rolesText ?? item.roles,
            careersUrl: local?.careersUrl?.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not add company.");
          return;
        }
        removeLocal(id);
        const added = (data.added ?? []) as Array<{
          title: string;
          status?: "open" | "closed";
        }>;
        const skipped = (data.skipped ?? []) as Array<{ title: string }>;
        setFlash(formatApproveFlash(added, skipped));
        return;
      }

      const res = await fetch(`/api/admin/company-requests/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "approve",
          careersUrl: local?.careersUrl?.trim() || null,
          rolesText: local?.rolesText ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not update request.");
        return;
      }

      setRequests((prev) => prev.filter((r) => r.id !== id));
      const added = (data.added ?? []) as Array<{
        title: string;
        status?: "open" | "closed";
      }>;
      const skipped = (data.skipped ?? []) as Array<{ title: string }>;
      setFlash(formatApproveFlash(added, skipped));
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  function stageLocalImport(
    found: Array<{
      company: string;
      roles?: string | null;
      contact?: string | null;
      createdAt?: string | null;
    }>,
    note: string,
  ) {
    const staged = toLocalRequests(found);
    const existing = readLocalQueue();
    const keys = new Set(
      existing.map(
        (r) =>
          `${r.company.trim().toLowerCase()}|${(r.roles ?? "").trim().toLowerCase()}`,
      ),
    );
    const merged = [...existing];
    for (const item of staged) {
      const key = `${item.company.trim().toLowerCase()}|${(item.roles ?? "").trim().toLowerCase()}`;
      if (keys.has(key)) continue;
      keys.add(key);
      merged.push(item);
    }
    writeLocalQueue(merged);
    setRequests((prev) => mergeQueues(prev.filter((r) => !r.local), merged));
    hydrateDrafts(merged);
    setFlash(note);
    setShowImport(false);
  }

  async function importFromFormSubmit() {
    if (!secret) return;
    setImporting(true);
    setFlash(null);
    setError(null);
    try {
      const found = await fetchFormSubmitSubmissions(formsubmitKey);
      if (found.length === 0) {
        setError("FormSubmit returned no company-request submissions.");
        return;
      }

      const res = await fetch("/api/admin/company-requests/import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "items",
          items: found.map((i) => ({
            company: i.company,
            roles: i.roles,
            contact: i.contact,
            createdAt: i.createdAt ?? null,
          })),
        }),
      });
      const data = await res.json();

      if (
        !res.ok ||
        data.tableMissing ||
        (data.imported === 0 && data.failed > 0)
      ) {
        stageLocalImport(
          found,
          `Loaded ${found.length} requests into your review queue. (DB table missing — ✓ still adds roles to the live site.)`,
        );
        if (!res.ok && data.error && !data.tableMissing) {
          // keep soft error only if it isn't the known missing-table case
        }
        return;
      }

      setFlash(
        `Imported ${data.imported} from FormSubmit (${found.length} found, ${data.skipped} skipped${
          data.failed ? `, ${data.failed} failed` : ""
        }).`,
      );
      await load(secret);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Network error during FormSubmit import.",
      );
    } finally {
      setImporting(false);
    }
  }

  async function importFromPaste() {
    if (!secret) return;
    if (!pasteText.trim()) {
      setError("Paste company-request email text first.");
      return;
    }
    setImporting(true);
    setFlash(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/company-requests/import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "paste",
          text: pasteText,
        }),
      });
      const data = await res.json();
      if (
        !res.ok ||
        data.tableMissing ||
        (data.imported === 0 && data.failed > 0)
      ) {
        // Parse on client via a second paste-path: ask server to return preview, or re-parse
        // Server already parsed — if failed, stage from preview if present.
        const preview = (data.preview ?? []) as Array<{
          company: string;
          roles?: string | null;
          contact?: string | null;
        }>;
        if (preview.length > 0) {
          stageLocalImport(
            preview,
            `Loaded ${preview.length} requests into your review queue. (DB table missing — ✓ still adds roles.)`,
          );
          setPasteText("");
          return;
        }
        setError(
          data.error ??
            "Could not save to database. Create company_requests in Supabase, or paste again after refresh.",
        );
        return;
      }
      setFlash(
        `Imported ${data.imported} from paste (${data.found} found, ${data.skipped} skipped).`,
      );
      setPasteText("");
      await load(secret);
    } catch {
      setError("Network error during paste import.");
    } finally {
      setImporting(false);
    }
  }

  if (!secret) {
    return (
      <div className="admin-panel">
        <p className="about-kicker">Admin</p>
        <h1>RadarApply admin</h1>
        <p className="admin-lead">
          Enter your admin secret to review company requests and see who signed
          up.
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
          <h1>RadarApply admin</h1>
        </div>
        <button type="button" className="admin-lock" onClick={lock}>
          Lock
        </button>
      </div>

      {loading && !report && requests.length === 0 ? (
        <p className="admin-lead">Loading…</p>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
      {flash ? <p className="admin-flash">{flash}</p> : null}

      <section className="admin-section">
        <h2>
          Company requests
          {requests.length > 0 ? (
            <span className="admin-count-pill">{requests.length}</span>
          ) : null}
        </h2>
        <p className="admin-lead">
          Approve (✓) checks if each role is already open: open → Apply Now,
          otherwise → monitor list. Leave roles blank to auto-scan the careers
          page / ATS for internship roles. Roles already in the catalog are
          skipped. Reject (✕) dismisses the request.
        </p>

        <div className="admin-import">
          <button
            type="button"
            className="admin-import-toggle"
            onClick={() => setShowImport((v) => !v)}
          >
            {showImport ? "Hide import" : "Import past inbox requests"}
          </button>
          {showImport ? (
            <div className="admin-import-panel">
              <p className="admin-lead">
                Paste <em>only the FormSubmit API key</em> from
                radarapply@gmail.com, then import. If the DB table isn&apos;t
                created yet, requests still load here so you can ✓ approve.
              </p>
              <label className="admin-request-field">
                <span>FormSubmit API key</span>
                <input
                  type="password"
                  value={formsubmitKey}
                  onChange={(e) => setFormsubmitKey(e.target.value)}
                  placeholder="Paste API key from FormSubmit email"
                  autoComplete="off"
                  disabled={importing}
                />
              </label>
              <button
                type="button"
                className="cta admin-import-btn"
                disabled={importing || !formsubmitKey.trim()}
                onClick={() => void importFromFormSubmit()}
              >
                {importing ? "Importing…" : "Import from FormSubmit"}
              </button>

              <label className="admin-request-field">
                <span>Or paste email text</span>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={6}
                  placeholder={
                    "Company: Acme\nRoles: SWE, PM\nContact: (555) 123-4567"
                  }
                  disabled={importing}
                />
              </label>
              <button
                type="button"
                className="btn-ghost admin-import-btn"
                disabled={importing || !pasteText.trim()}
                onClick={() => void importFromPaste()}
              >
                Import pasted emails
              </button>
            </div>
          ) : null}
        </div>

        {requests.length === 0 ? (
          <p className="admin-empty">No pending company requests.</p>
        ) : (
          <ul className="admin-requests" role="list">
            {requests.map((item) => {
              const localDraft = drafts[item.id] ?? {
                careersUrl: "",
                rolesText: item.roles ?? "",
              };
              const previewRoles = hasListedRoles(localDraft.rolesText)
                ? parseRequestedRoles(localDraft.rolesText)
                : null;
              const busy = busyId === item.id;

              return (
                <li key={item.id} className="admin-request">
                  <div className="admin-request-main">
                    <div className="admin-request-head">
                      <strong>{item.company}</strong>
                      <em>
                        {new Date(item.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {item.local ? " · inbox" : ""}
                      </em>
                    </div>
                    {item.contact ? (
                      <p className="admin-request-meta">
                        From {formatPhoneDisplay(item.contact) || item.contact}
                      </p>
                    ) : null}

                    <label className="admin-request-field">
                      <span>Roles</span>
                      <input
                        type="text"
                        value={localDraft.rolesText}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...localDraft,
                              rolesText: e.target.value,
                            },
                          }))
                        }
                        placeholder="SWE, PM, Data Science"
                        disabled={busy}
                      />
                    </label>

                    <label className="admin-request-field">
                      <span>Careers URL (optional)</span>
                      <input
                        type="url"
                        value={localDraft.careersUrl}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...localDraft,
                              careersUrl: e.target.value,
                            },
                          }))
                        }
                        placeholder="https://…/careers (enables auto-monitor)"
                        disabled={busy}
                      />
                    </label>

                    <p className="admin-request-preview">
                      {previewRoles
                        ? `Will add: ${previewRoles.join(" · ")}`
                        : localDraft.careersUrl.trim()
                          ? "Roles blank — will auto-scan careers/ATS for internships."
                          : "Roles blank — will try to find this company’s internship board, or default to Software Engineering Intern."}
                    </p>
                  </div>

                  <div className="admin-request-actions">
                    <button
                      type="button"
                      className="admin-approve"
                      aria-label={`Approve ${item.company}`}
                      title="Approve and add"
                      disabled={busy}
                      onClick={() => void review(item.id, "approve")}
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      className="admin-reject"
                      aria-label={`Reject ${item.company}`}
                      title="Reject"
                      disabled={busy}
                      onClick={() => void review(item.id, "reject")}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {report ? (
        <section className="admin-section admin-stats">
          <h2>Signups</h2>
          <p className="admin-stats-line">
            <strong>{report.users}</strong> active{" "}
            {report.users === 1 ? "user" : "users"}
            <span aria-hidden="true"> · </span>
            <strong>{report.subscriptions}</strong>{" "}
            {report.subscriptions === 1 ? "position" : "positions"} monitoring
          </p>
        </section>
      ) : null}
    </div>
  );
}
