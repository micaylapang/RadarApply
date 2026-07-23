/**
 * Turn a free-text company request into catalog rows we can track + alert on.
 */

import {
  guessCompanyDomain,
  resolveCompanyLogoUrl,
} from "@/lib/company-logos";
import { detectMany, discoverInternshipRoles } from "@/lib/detect";

export { guessCompanyDomain };

export function slugifyPart(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** True when the admin/request actually listed one or more roles. */
export function hasListedRoles(rolesText: string | null | undefined) {
  return Boolean(rolesText?.trim());
}

/**
 * Split "SWE, PM / Data Science" style role text into internship titles.
 * Defaults to Software Engineering Intern when blank.
 */
export function parseRequestedRoles(rolesText: string | null | undefined): string[] {
  const raw = (rolesText ?? "").trim();
  if (!raw) return ["Software Engineering Intern"];

  const parts = raw
    .split(/[\n,;/|]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) return ["Software Engineering Intern"];

  return parts.map((part) => {
    const titled = part.replace(/\s+/g, " ").trim();
    if (/\bintern(?:ship)?s?\b/i.test(titled)) return titled;
    return `${titled} Intern`;
  });
}

export function titleFilterForRole(title: string) {
  const withoutIntern = title
    .replace(/\b(?:summer\s*)?20\d{2}\b/gi, "")
    .replace(/\bintern(?:ship)?s?\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return withoutIntern || title.trim();
}

export type RequestCatalogSourceType =
  | "greenhouse"
  | "lever"
  | "ashby"
  | "careers-page"
  | "manual";

export type RequestCatalogItem = {
  company: string;
  title: string;
  slug: string;
  description: string;
  applyUrl: string;
  sourceType: RequestCatalogSourceType;
  sourceKey: string | null;
  titleFilter: string;
  managedBy: "request";
  domain: string;
  logoUrl: string;
};

export type CheckedRequestCatalogItem = RequestCatalogItem & {
  /** open → Apply Now; closed → monitor list */
  status: "open" | "closed";
  lastChecked: string | null;
};

export function buildRequestCatalogItems(opts: {
  company: string;
  rolesText?: string | null;
  careersUrl?: string | null;
  logoUrl: string;
}): RequestCatalogItem[] {
  const company = opts.company.trim();
  const roles = parseRequestedRoles(opts.rolesText);
  const domain = guessCompanyDomain(company);
  const baseUrl =
    opts.careersUrl?.trim() ||
    `https://www.google.com/search?q=${encodeURIComponent(`${company} internship careers`)}`;

  return roles.map((title) => {
    const slug = `${slugifyPart(company)}-${slugifyPart(title)}`;
    return {
      company,
      title,
      slug,
      description: `${company} ${title} (added from company request)`,
      applyUrl: baseUrl,
      // Careers-page scrape when we have a real careers URL; search URLs stay manual.
      sourceType: opts.careersUrl?.trim()
        ? ("careers-page" as const)
        : ("manual" as const),
      sourceKey: opts.careersUrl?.trim() ? opts.careersUrl.trim() : null,
      titleFilter: titleFilterForRole(title),
      managedBy: "request" as const,
      domain,
      logoUrl: opts.logoUrl,
    };
  });
}

/**
 * Build catalog rows, then check careers boards once before insert.
 * Already-open roles land on Apply Now (no opened_at — already live).
 * Closed / unscrapeable roles land on the monitor list.
 *
 * When roles aren't listed, scan the company's ATS / careers page for
 * internship families and add each (open → Apply Now, else → monitor).
 * Always attaches a resolvable logo URL.
 */
export async function buildAndCheckRequestCatalogItems(opts: {
  company: string;
  rolesText?: string | null;
  careersUrl?: string | null;
}): Promise<CheckedRequestCatalogItem[]> {
  const now = new Date().toISOString();
  const company = opts.company.trim();
  const domain = guessCompanyDomain(company);
  const logoUrl = await resolveCompanyLogoUrl({
    company,
    careersUrl: opts.careersUrl,
  });

  if (!hasListedRoles(opts.rolesText)) {
    const discovered = await discoverInternshipRoles({
      company,
      careersUrl: opts.careersUrl,
    });

    if (discovered.length > 0) {
      return discovered.map((role) => {
        const slug = `${slugifyPart(company)}-${slugifyPart(role.title)}`;
        return {
          company,
          title: role.title,
          slug,
          description: `${company} ${role.title} (discovered from company request)`,
          applyUrl: role.applyUrl,
          sourceType: role.sourceType,
          sourceKey: role.sourceKey,
          titleFilter: role.titleFilter,
          managedBy: "request" as const,
          domain,
          logoUrl,
          status: role.open ? ("open" as const) : ("closed" as const),
          lastChecked: now,
        };
      });
    }
  }

  const items = buildRequestCatalogItems({ ...opts, logoUrl });

  const detections = await detectMany(
    items.map((item) => ({
      id: item.slug,
      sourceType: item.sourceType,
      sourceKey: item.sourceKey,
      titleFilter: item.titleFilter,
      currentStatus: "closed",
      applyUrl: item.applyUrl,
    })),
  );

  return items.map((item) => {
    const result = detections.get(item.slug);
    if (!result || result.skipped || result.fetchFailed) {
      return { ...item, status: "closed" as const, lastChecked: null };
    }
    if (result.open) {
      return {
        ...item,
        status: "open" as const,
        applyUrl: result.jobs[0]?.absoluteUrl ?? item.applyUrl,
        lastChecked: now,
      };
    }
    return { ...item, status: "closed" as const, lastChecked: now };
  });
}
