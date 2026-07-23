/**
 * Turn a free-text company request into catalog rows we can track + alert on.
 */

export function slugifyPart(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Guess a public website domain for logos / careers URL fallbacks. */
export function guessCompanyDomain(company: string) {
  const cleaned = company
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 48);
  return cleaned ? `${cleaned}.com` : "example.com";
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

export function buildRequestCatalogItems(opts: {
  company: string;
  rolesText?: string | null;
  careersUrl?: string | null;
}) {
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
      sourceType: opts.careersUrl?.trim() ? ("careers-page" as const) : ("manual" as const),
      sourceKey: opts.careersUrl?.trim() ? opts.careersUrl.trim() : null,
      titleFilter: titleFilterForRole(title),
      managedBy: "request" as const,
      domain,
    };
  });
}
