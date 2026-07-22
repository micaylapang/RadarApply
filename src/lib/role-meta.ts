/** Season chips shown in signup — Summer 2027 only. */
export const TIMELINES = [
  { id: "summer-2027", label: "Summer 2027 ☀️", season: "Summer", year: 2027 },
] as const;

export type TimelineId = (typeof TIMELINES)[number]["id"];

export const DEFAULT_TIMELINE: TimelineId = "summer-2027";

/** Product target — every watch + live board hit should match this cycle. */
export const TARGET_SEASON = "Summer";
export const TARGET_YEAR = 2027;

export function roleBaseTitle(title: string): string {
  return title
    .replace(/\s*\((?:US\s+)?(?:Summer|Fall|Spring|Winter)[^)]*\)/gi, "")
    .replace(/\s*[-–—]\s*(Summer|Fall|Spring|Winter).*$/i, "")
    .replace(/\s+(Summer|Fall|Spring|Winter)\s+\d{4}\s*$/i, "")
    .replace(/\s*[—–-]\s*Summer\s+2027\s*$/i, "")
    .trim();
}

function stripUsOnlySuffix(title: string): string {
  return title.replace(/\s*\((?:US|United States)\)\s*$/i, "").trim();
}

/**
 * Shared role name across location / track variants.
 * "Software Engineer Intern — Chicago" → "Software Engineer Intern"
 * "Software Engineer Intern - C++" → "Software Engineer Intern"
 */
export function roleFamilyTitle(title: string): string {
  const base = stripUsOnlySuffix(roleBaseTitle(title));
  const split = base.split(/\s*[—–]\s*|\s+-\s+/);
  if (split.length >= 2 && split[0].trim()) return split[0].trim();
  return base;
}

/** Location / track label for a variant, or null when the title is already the family. */
export function roleVariantLabel(title: string): string | null {
  const base = stripUsOnlySuffix(roleBaseTitle(title));
  const family = roleFamilyTitle(title);
  if (base.toLowerCase() === family.toLowerCase()) return null;
  const rest = base.slice(family.length).replace(/^[\s—–-]+/, "").trim();
  return rest || null;
}

/** Stable key for one company + role (ignores season/location suffixes). */
export function companyRoleKey(company: string, title: string): string {
  return `${company.trim().toLowerCase()}::${roleBaseTitle(title).toLowerCase()}`;
}

/** Company + role family (groups Chicago/Austin SWE under one key). */
export function companyRoleFamilyKey(company: string, title: string): string {
  return `${company.trim().toLowerCase()}::${roleFamilyTitle(title).toLowerCase()}`;
}

/**
 * Keep the first occurrence of each company + base role title.
 * Prevents duplicate alert rows when multiple internship IDs map to the same role.
 */
export function dedupeByCompanyRole<T extends { company: string; title: string }>(
  items: T[],
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = companyRoleKey(item.company, item.title);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/**
 * Apply Now: keep one row per direct posting. Same role title in different
 * cities (different apply URLs) must all stay visible.
 */
export function dedupeByCompanyApplyUrl<
  T extends { company: string; title: string; applyUrl?: string | null },
>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const url = item.applyUrl?.trim();
    const key = url
      ? `${item.company.trim().toLowerCase()}::${url}`
      : companyRoleKey(item.company, item.title);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function roleSeason(title: string): string | null {
  const m = title.match(/\b(Summer|Fall|Spring|Winter)\b/i);
  if (!m) return null;
  return m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
}

export function roleYears(title: string): number[] {
  return [...title.matchAll(/\b(20\d{2})\b/g)].map((m) => Number(m[1]));
}

/**
 * Live board titles must signal Summer 2027:
 * - "Summer 2027 …" → match
 * - "… Summer" with no year (or only 2027) → match
 * - Jump-style "Campus … (Intern)" with no other season/year → match
 * Rejects Fall/Spring/Winter, other years, and seasonless non-campus titles.
 */
export function matchesSummer2027(title: string): boolean {
  const seasonYear = title.match(
    /\b(Summer|Fall|Spring|Winter)\s+(\d{4})\b/i,
  );
  if (seasonYear) {
    const season =
      seasonYear[1][0].toUpperCase() + seasonYear[1].slice(1).toLowerCase();
    const year = Number(seasonYear[2]);
    return season === TARGET_SEASON && year === TARGET_YEAR;
  }

  const season = roleSeason(title);
  const years = roleYears(title);

  // Jump Trading campus posts omit "Summer"/"2027" but are the summer cycle.
  if (/\bcampus\b/i.test(title) && /\bintern(?:ship)?\b/i.test(title)) {
    if (season && season !== TARGET_SEASON) return false;
    if (years.length > 0 && !years.includes(TARGET_YEAR)) return false;
    return true;
  }

  if (season !== TARGET_SEASON) return false;

  if (years.length === 0) return true;
  return years.includes(TARGET_YEAR) && years.every((y) => y === TARGET_YEAR);
}

/** Signup selection — curated watches are Summer 2027 even if title omits the year. */
export function timelineMatches(
  title: string,
  selectedTimelineIds: Set<string>,
): boolean {
  if (selectedTimelineIds.size === 0) return false;
  if (!selectedTimelineIds.has(DEFAULT_TIMELINE)) return false;

  const season = roleSeason(title);
  const years = roleYears(title);

  if (season && season !== TARGET_SEASON) return false;
  if (years.length > 0 && !years.includes(TARGET_YEAR)) return false;

  const seasonYear = title.match(
    /\b(Summer|Fall|Spring|Winter)\s+(\d{4})\b/i,
  );
  if (seasonYear) {
    return matchesSummer2027(title);
  }

  // Catalog roles without season/year are treated as our locked Summer 2027 watch.
  return true;
}
