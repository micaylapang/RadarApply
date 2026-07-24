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
 * "Software Engineer Intern, Infrastructure" → "Software Engineer Intern"
 */
export function roleFamilyTitle(title: string): string {
  const base = stripUsOnlySuffix(roleBaseTitle(title));
  const dashSplit = base.split(/\s*[—–]\s*|\s+-\s+/);
  if (dashSplit.length >= 2 && dashSplit[0].trim()) {
    return dashSplit[0].trim();
  }
  // Team / track after a comma — only when the left side is already a full
  // intern title (avoids splitting "Business, Marketing & Creative Intern").
  const commaIdx = base.search(/,\s+/);
  if (commaIdx > 0) {
    const left = base.slice(0, commaIdx).trim();
    if (/\bintern(?:ship)?s?\b/i.test(left)) return left;
  }
  return base;
}

/** Location / track label for a variant, or null when the title is already the family. */
export function roleVariantLabel(title: string): string | null {
  const base = stripUsOnlySuffix(roleBaseTitle(title));
  const family = roleFamilyTitle(title);
  if (base.toLowerCase() === family.toLowerCase()) return null;
  const rest = base
    .slice(family.length)
    .replace(/^[\s,—–-]+/, "")
    .trim();
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

/** Whole-token expansions for common internship abbreviations. */
const ROLE_ABBREVIATIONS: Record<string, string> = {
  swe: "software engineer",
  sde: "software engineer",
  sw: "software",
  pm: "product manager",
  apm: "associate product manager",
  tpm: "technical program manager",
  pgm: "program manager",
  ml: "machine learning",
  ai: "artificial intelligence",
  ds: "data science",
  de: "data engineer",
  da: "data analyst",
  qa: "quality assurance",
  qe: "quality engineer",
  ux: "user experience",
  ui: "user interface",
  hw: "hardware",
  fw: "firmware",
  emb: "embedded",
  sre: "site reliability engineer",
  it: "information technology",
  hr: "human resources",
  fdse: "forward deployed software engineer",
  fds: "forward deployed",
};

const ROLE_NOISE =
  /\b(?:intern(?:ship)?s?|co-?ops?|undergraduate|undergrads?|university|new\s*grads?|campus|fellow(?:ship)?s?|summer|fall|spring|winter|20\d{2}|usa?|united\s+states|remote|hybrid)\b/gi;

function expandRoleAbbreviations(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => ROLE_ABBREVIATIONS[token] ?? token)
    .join(" ");
}

/**
 * Canonical form for comparing whether two role titles are the "same" job.
 * Strips season/location noise, expands SWE/PM/etc., and normalizes
 * engineer↔engineering / manager↔management style variants.
 */
export function normalizeRoleMatchKey(title: string): string {
  let text = roleFamilyTitle(title)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+#.\s]/g, " ");

  text = text.replace(ROLE_NOISE, " ");
  text = expandRoleAbbreviations(text.replace(/\s+/g, " ").trim());

  text = text
    .replace(/\bengineering\b/g, "engineer")
    .replace(/\bmanagement\b/g, "manager")
    .replace(/\bmanagers\b/g, "manager")
    .replace(/\bengineers\b/g, "engineer")
    .replace(/\bdesigners?\b/g, "design")
    .replace(/\bscientists?\b/g, "science")
    .replace(/\banalytics\b/g, "analyst")
    .replace(/\banalysts?\b/g, "analyst")
    .replace(/\bresearchers?\b/g, "research")
    .replace(/\bdevelopers?\b/g, "develop")
    .replace(/\bdevelopment\b/g, "develop")
    .replace(/\bprogrammers?\b/g, "program")
    .replace(/\bprogramming\b/g, "program");

  // Re-expand in case abbreviations produced multi-word phrases that need stemming.
  text = expandRoleAbbreviations(text);
  text = text
    .replace(/\bengineering\b/g, "engineer")
    .replace(/\bmanagement\b/g, "manager");

  const tokens = text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .sort();

  return tokens.join(" ");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

/**
 * True when titles describe the same role despite typos / wording differences
 * (e.g. SWE vs Software Engineer, Engineering vs Engineer, Sofware typo).
 */
export function rolesAreNearDuplicate(a: string, b: string): boolean {
  const ka = normalizeRoleMatchKey(a);
  const kb = normalizeRoleMatchKey(b);
  if (!ka || !kb) return false;
  if (ka === kb) return true;

  const dist = levenshtein(ka, kb);
  const maxLen = Math.max(ka.length, kb.length);
  // Allow small typos; keep threshold tight so Product Manager ≠ Program Manager.
  const allowed = Math.min(3, Math.max(1, Math.floor(maxLen * 0.12)));
  return dist <= allowed;
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

/** Companies whose live Greenhouse posts are Fall 2026 (season often only on the form). */
export const FALL_2026_APPLY_COMPANIES = new Set(["Neuralink"]);

export type ApplySeasonId = "fall-2026" | "summer-2027";

export type ApplySeason = {
  id: ApplySeasonId;
  label: string;
  /** Lower sorts first on Apply Now. */
  sort: number;
};

/**
 * Season bucket for Apply Now. Fall 2026 is listed ahead of Summer 2027 when both exist.
 */
export function roleApplySeason(
  title: string,
  company?: string,
): ApplySeason {
  if (company && FALL_2026_APPLY_COMPANIES.has(company)) {
    return { id: "fall-2026", label: "Fall 2026", sort: 0 };
  }
  if (matchesFall2026(title)) {
    return { id: "fall-2026", label: "Fall 2026", sort: 0 };
  }
  return { id: "summer-2027", label: "Summer 2027", sort: 1 };
}

export function matchesFall2026(title: string): boolean {
  const seasonYear = title.match(
    /\b(Summer|Fall|Spring|Winter)\s+(\d{4})\b/i,
  );
  if (seasonYear) {
    const season =
      seasonYear[1][0].toUpperCase() + seasonYear[1].slice(1).toLowerCase();
    const year = Number(seasonYear[2]);
    return season === "Fall" && year === 2026;
  }

  const season = roleSeason(title);
  const years = roleYears(title);
  if (season !== "Fall") return false;
  if (years.length === 0) return true;
  return years.includes(2026) && years.every((y) => y === 2026);
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
