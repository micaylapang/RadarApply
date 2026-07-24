"use client";

import { useEffect, useMemo, useState } from "react";
import { isDirectApplyUrl } from "@/lib/apply-url";
import { companyLogoUrl } from "@/lib/company-logos";
import { isRoleOpenForApply } from "@/lib/company-status";
import {
  companyRoleFamilyKey,
  dedupeByCompanyApplyUrl,
  roleApplySeason,
  roleFamilyTitle,
  roleVariantLabel,
  type ApplySeason,
} from "@/lib/role-meta";

type OpenRole = {
  id: string;
  company: string;
  title: string;
  status: string;
  applyUrl: string | null;
  openedAt: string | null;
  logoUrl?: string | null;
};

type RoleFamily = {
  key: string;
  title: string;
  variants: Array<{
    id: string;
    label: string;
    applyUrl: string;
  }>;
};

type CompanyGroup = {
  company: string;
  logoUrl: string | null;
  families: RoleFamily[];
};

type SeasonSection = {
  season: ApplySeason;
  companies: CompanyGroup[];
};

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

function isListedOpen(role: OpenRole) {
  return isRoleOpenForApply(role.company, role);
}

function groupRoleFamilies(companyRoles: OpenRole[]): RoleFamily[] {
  const map = new Map<string, RoleFamily>();

  for (const role of companyRoles) {
    if (!role.applyUrl) continue;
    const key = companyRoleFamilyKey(role.company, role.title);
    const familyTitle = roleFamilyTitle(role.title);
    const variant = roleVariantLabel(role.title);
    const existing = map.get(key);
    const option = {
      id: role.id,
      label: variant ?? "Open role",
      applyUrl: role.applyUrl,
    };

    if (!existing) {
      map.set(key, {
        key,
        title: familyTitle,
        variants: [option],
      });
      continue;
    }

    if (existing.variants.some((v) => v.applyUrl === option.applyUrl)) continue;
    existing.variants.push(option);
  }

  return Array.from(map.values())
    .map((family) => ({
      ...family,
      variants: family.variants.sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

function RoleApplyRow({ family }: { family: RoleFamily }) {
  const [selectedId, setSelectedId] = useState(family.variants[0]?.id ?? "");

  useEffect(() => {
    if (family.variants.some((v) => v.id === selectedId)) return;
    setSelectedId(family.variants[0]?.id ?? "");
  }, [family.variants, selectedId]);

  const selected =
    family.variants.find((v) => v.id === selectedId) ?? family.variants[0];

  if (!selected) return null;

  if (family.variants.length === 1) {
    return (
      <a
        className="apply-link-btn"
        href={selected.applyUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="apply-link-copy">
          <span className="apply-link-title">{family.title}</span>
          <span className="apply-link-meta is-open-now">Open Now</span>
        </span>
        <span className="apply-link-arrow" aria-hidden="true">
          →
        </span>
      </a>
    );
  }

  return (
    <div className="apply-link-btn apply-role-family">
      <span className="apply-link-copy">
        <span className="apply-link-title">{family.title}</span>
        <span className="apply-link-meta is-open-now">
          {family.variants.length} types · Open Now
        </span>
      </span>
      <div className="apply-role-family-actions">
        <label className="sr-only" htmlFor={`apply-variant-${family.key}`}>
          Choose {family.title} type
        </label>
        <select
          id={`apply-variant-${family.key}`}
          className="apply-role-select"
          value={selected.id}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {family.variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.label}
            </option>
          ))}
        </select>
        <a
          className="apply-role-go"
          href={selected.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Apply
          <span aria-hidden="true"> →</span>
        </a>
      </div>
    </div>
  );
}

export function OpenRolesBoard() {
  const [roles, setRoles] = useState<OpenRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/internships", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !Array.isArray(data.internships)) {
          if (!cancelled) setError("Could not load open roles.");
          return;
        }
        if (!cancelled) {
          setRoles(data.internships as OpenRole[]);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Network error. Try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const id = window.setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const sections = useMemo(() => {
    const open = dedupeByCompanyApplyUrl(
      roles.filter(
        (role) => isListedOpen(role) && isDirectApplyUrl(role.applyUrl),
      ),
    );

    const bySeason = new Map<
      string,
      { season: ApplySeason; byCompany: Map<string, OpenRole[]> }
    >();

    for (const role of open) {
      const season = roleApplySeason(role.title, role.company);
      let bucket = bySeason.get(season.id);
      if (!bucket) {
        bucket = { season, byCompany: new Map() };
        bySeason.set(season.id, bucket);
      }
      const list = bucket.byCompany.get(role.company) ?? [];
      list.push(role);
      bucket.byCompany.set(role.company, list);
    }

    const out: SeasonSection[] = Array.from(bySeason.values())
      .map(({ season, byCompany }) => ({
        season,
        companies: Array.from(byCompany.entries())
          .map(([company, companyRoles]) => ({
            company,
            logoUrl: companyRoles.find((r) => r.logoUrl)?.logoUrl ?? null,
            families: groupRoleFamilies(companyRoles),
          }))
          .sort((a, b) => a.company.localeCompare(b.company)),
      }))
      .sort((a, b) => a.season.sort - b.season.sort);

    return out;
  }, [roles]);

  function toggleCompany(seasonId: string, company: string) {
    const key = `${seasonId}::${company}`;
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="open-board">
        <p className="open-board-kicker">Apply Now</p>
        <h1>Loading live openings…</h1>
      </div>
    );
  }

  const totalCompanies = sections.reduce(
    (n, section) => n + section.companies.length,
    0,
  );

  return (
    <div className="open-board">
      <p className="open-board-kicker">Apply Now</p>
      <h1>Apply ASAP — you already missed the drop.</h1>
      <p className="open-board-lead">
        The longer the application has been open for, the lower your chances
        become.
      </p>
      <a className="btn-primary open-signup-cta" href="/signup">
        Sign Up For Text Alerts For New Openings&nbsp;🚨
      </a>

      {error ? <p className="form-error">{error}</p> : null}

      {totalCompanies === 0 ? (
        <p className="open-board-empty">
          No direct apply links are live in the catalog right now. Track roles
          on signup and we&apos;ll text you the minute they open.
        </p>
      ) : (
        <div className="open-season-stack">
          {sections.map(({ season, companies }) => (
            <section
              key={season.id}
              className="open-season-section"
              aria-labelledby={`open-season-${season.id}`}
            >
              <div className="open-season-header">
                <h2 id={`open-season-${season.id}`} className="open-season-title">
                  {season.label}
                </h2>
                <p className="open-season-meta">
                  {companies.length} compan
                  {companies.length === 1 ? "y" : "ies"} open
                </p>
              </div>

              <ul className="open-company-list" role="list">
                {companies.map(({ company, logoUrl, families }) => {
                  const expandKey = `${season.id}::${company}`;
                  const isOpen = expanded.has(expandKey);
                  const count = families.length;
                  const panelId = `open-roles-${season.id}-${company
                    .replace(/\s+/g, "-")
                    .toLowerCase()}`;

                  return (
                    <li
                      key={expandKey}
                      className={`open-company${isOpen ? " is-expanded" : ""}`}
                    >
                      <div className="open-company-row">
                        <div className="open-company-title">
                          <CompanyLogo company={company} logoUrl={logoUrl} />
                          <div className="open-company-copy">
                            <h3>{company}</h3>
                            <p className="open-company-meta is-open-now">
                              Open Now · {season.label}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="open-view-roles"
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          onClick={() => toggleCompany(season.id, company)}
                        >
                          <span>
                            {isOpen ? "Hide Roles" : `View Roles (${count})`}
                          </span>
                          <span className="open-view-chevron" aria-hidden="true">
                            {isOpen ? "▴" : "▾"}
                          </span>
                        </button>
                      </div>

                      {isOpen ? (
                        <div
                          id={panelId}
                          className="open-company-roles apply-link-list"
                          role="region"
                          aria-label={`${company} ${season.label} open roles`}
                        >
                          {families.map((family) => (
                            <RoleApplyRow key={family.key} family={family} />
                          ))}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
