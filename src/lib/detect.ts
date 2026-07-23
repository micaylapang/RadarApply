import {
  matchesSummer2027,
  roleFamilyTitle,
  roleSeason,
  roleYears,
  TARGET_YEAR,
} from "@/lib/role-meta";
import {
  isUsCountryCode,
  isUsCountryName,
  isUsLocationHint,
} from "@/lib/location";

export type JobHit = { title: string; absoluteUrl?: string };

type RawJob = {
  title: string;
  absoluteUrl?: string;
  locationHints: Array<string | null | undefined>;
  countryCode?: string | null;
  countryName?: string | null;
  /** Full HTML for careers-page scraping. */
  pageText?: string;
};

function isCareersPageClosed(html: string) {
  return /no longer available|no longer accepting|position has been filled|job is closed|this job posting is unavailable|role has been filled|page not found|error 404|0 results found|no jobs found|no open positions/i.test(
    html,
  );
}

function isDirectJobPostingUrl(url: string) {
  return (
    /jobs\.apple\.com\/.*\/details\//i.test(url) ||
    /\/jobs\/results\/\d+/i.test(url) ||
    /\/jobs\/\d+\/?$/i.test(url) ||
    /\/details\/\d+/i.test(url)
  );
}

function careersPageIsOpen(
  html: string,
  url: string,
  titleFilter: string | null | undefined,
) {
  if (isCareersPageClosed(html)) return false;

  const haystack = html.toLowerCase();
  const needle = titleFilter?.trim().toLowerCase();
  if (needle && !haystack.includes(needle)) return false;

  const hasIntern =
    /\bintern(?:ship)?s?\b/i.test(html) ||
    (needle ? /\bintern(?:ship)?s?\b/i.test(needle) : false);
  if (!hasIntern) return false;

  if (isDirectJobPostingUrl(url)) return true;

  if (matchesSummer2027(html)) return true;
  if (needle && matchesSummer2027(needle)) return true;

  return /summer\s*2027/i.test(html);
}

async function fetchCareersPage(url: string): Promise<RawJob[] | null> {
  const html = await fetchText(url, 10000);
  if (!html) return null;
  return [
    {
      title: "__page__",
      absoluteUrl: url,
      locationHints: ["United States"],
      pageText: html,
    },
  ];
}

async function fetchJson<T>(url: string, timeoutMs = 8000): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "RadarApplyMonitor/1.0",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function matchesFilter(title: string, filter: string | null | undefined) {
  if (!filter) return true;
  return title.toLowerCase().includes(filter.toLowerCase());
}

function isInternshipTitle(title: string) {
  return /\b(intern(?:ship)?s?|co-?op)\b/i.test(title);
}

/** Internship + Summer 2027 (or company-specific rolling intern exception). */
function isTargetRole(title: string, sourceKey?: string | null) {
  if (!isInternshipTitle(title)) return false;
  if (matchesSummer2027(title)) return true;

  // Neuralink / Kalshi post year-round US intern roles without a season/year.
  if (sourceKey === "neuralink" || sourceKey === "kalshi") {
    if (roleSeason(title)) return false;
    const years = roleYears(title);
    return years.length === 0 || years.includes(TARGET_YEAR);
  }

  return false;
}

function sourceCacheKey(sourceType: string, sourceKey: string) {
  return `${sourceType}:${sourceKey}`;
}

async function fetchGreenhouseBoard(board: string): Promise<RawJob[]> {
  const data = await fetchJson<{
    jobs?: Array<{
      title: string;
      absolute_url?: string;
      location?: { name?: string };
    }>;
  }>(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs`,
  );
  return (data?.jobs ?? []).map((j) => ({
    title: j.title,
    absoluteUrl: j.absolute_url,
    locationHints: [j.location?.name, j.title],
  }));
}

async function fetchLeverBoard(company: string): Promise<RawJob[]> {
  const data = await fetchJson<
    Array<{
      text: string;
      hostedUrl?: string;
      country?: string;
      categories?: { location?: string; commitment?: string };
      workplaceType?: string;
    }>
  >(`https://api.lever.co/v0/postings/${encodeURIComponent(company)}?mode=json`);
  return (data ?? []).map((j) => ({
    title: j.text,
    absoluteUrl: j.hostedUrl,
    locationHints: [
      j.country,
      j.categories?.location,
      j.workplaceType,
      j.text,
    ],
  }));
}

async function fetchAshbyBoard(company: string): Promise<RawJob[]> {
  const data = await fetchJson<{
    jobs?: Array<{
      title: string;
      jobUrl?: string;
      location?: string;
      secondaryLocations?: string[];
      address?: { postalAddress?: { addressCountry?: string } };
    }>;
  }>(
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(company)}`,
  );
  return (data?.jobs ?? []).map((j) => ({
    title: j.title,
    absoluteUrl: j.jobUrl,
    locationHints: [j.location, ...(j.secondaryLocations ?? []), j.title],
    countryName: j.address?.postalAddress?.addressCountry,
  }));
}

async function fetchAmazonSearch(query: string): Promise<RawJob[]> {
  const params = new URLSearchParams({
    base_query: query,
    loc_query: "United States",
    offset: "0",
    result_limit: "100",
    sort: "relevant",
  });
  const data = await fetchJson<{
    jobs?: Array<{
      title?: string;
      job_path?: string;
      country_code?: string;
      city?: string;
      location_name?: string;
    }>;
  }>(`https://www.amazon.jobs/en/search.json?${params.toString()}`);

  return (data?.jobs ?? []).map((j) => ({
    title: j.title ?? "",
    absoluteUrl: j.job_path ? `https://www.amazon.jobs${j.job_path}` : undefined,
    locationHints: [j.title, j.city, j.location_name],
    countryCode: j.country_code,
  }));
}

async function fetchText(url: string, timeoutMs = 12000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent":
          "Mozilla/5.0 (compatible; RadarApplyMonitor/1.0; +https://www.radarapply.com)",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function slugifyGoogleTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Google Careers has no public JSON board API. We scrape the search HTML and
 * parse AF_initDataCallback job tuples: [id, title, applyUrl, ...].
 * Returns null on fetch/parse failure so status is left unchanged.
 */
async function fetchGoogleCareersSearch(query: string): Promise<RawJob[] | null> {
  const params = new URLSearchParams({
    q: query,
    location: "United States",
  });
  const html = await fetchText(
    `https://careers.google.com/jobs/results/?${params.toString()}`,
    20000,
  );
  if (!html) return null;
  // Bot wall / layout change — don't treat as "closed".
  if (!html.includes("AF_initDataCallback")) return null;

  const jobs: RawJob[] = [];
  const seen = new Set<string>();
  const re = /\["(\d{10,})","([^"]{3,200})","(https:[^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const id = match[1];
    const title = match[2];
    const link = match[3];
    if (seen.has(id)) continue;
    seen.add(id);
    const slug = slugifyGoogleTitle(title);
    jobs.push({
      title,
      absoluteUrl: `https://www.google.com/about/careers/applications/jobs/results/${id}-${slug}`,
      locationHints: [
        "United States",
        title,
        /loc\\u003dUS|loc=US/i.test(link) ? "US" : null,
      ],
    });
  }

  return jobs;
}

async function fetchBoardJobs(
  sourceType: string,
  sourceKey: string,
): Promise<RawJob[] | null> {
  switch (sourceType) {
    case "greenhouse":
      return fetchGreenhouseBoard(sourceKey);
    case "lever":
      return fetchLeverBoard(sourceKey);
    case "ashby":
      return fetchAshbyBoard(sourceKey);
    case "amazon":
      return fetchAmazonSearch(sourceKey);
    case "google":
      return fetchGoogleCareersSearch(sourceKey);
    case "careers-page":
      return fetchCareersPage(sourceKey);
    default:
      return null;
  }
}

function filterCareersPageJobs(
  raw: RawJob[],
  sourceKey: string,
  titleFilter: string | null,
): JobHit[] {
  const html = raw[0]?.pageText ?? "";
  if (!html || !careersPageIsOpen(html, sourceKey, titleFilter)) return [];
  return [
    {
      title: titleFilter?.trim() || "Internship",
      absoluteUrl: raw[0]?.absoluteUrl ?? sourceKey,
    },
  ];
}

function filterBoardJobs(
  raw: RawJob[],
  sourceType: string,
  sourceKey: string,
  titleFilter: string | null,
): JobHit[] {
  if (sourceType === "careers-page") {
    return filterCareersPageJobs(raw, sourceKey, titleFilter);
  }

  const hits = raw
    .filter((j) => {
      if (sourceType === "amazon" && !isUsCountryCode(j.countryCode)) {
        return false;
      }
      if (!isTargetRole(j.title, sourceKey)) return false;
      if (!matchesFilter(j.title, titleFilter)) return false;
      if (j.countryName) return isUsCountryName(j.countryName);
      return isUsLocationHint(...j.locationHints);
    })
    .map((j) => ({ title: j.title, absoluteUrl: j.absoluteUrl }));

  // Prefer BS over MS when Google lists both for the same watch.
  if (sourceType === "google") {
    hits.sort((a, b) => {
      const aBs = /\bBS\b/i.test(a.title) ? 0 : 1;
      const bBs = /\bBS\b/i.test(b.title) ? 0 : 1;
      return aBs - bBs;
    });
  }

  return hits;
}

function isScrapableCareersUrl(url: string) {
  if (!/^https?:\/\//i.test(url)) return false;
  // Search-engine fallbacks from request approvals — not real careers pages.
  if (/google\.[^/]+\/search/i.test(url)) return false;
  if (/bing\.[^/]+\/search/i.test(url)) return false;
  if (/duckduckgo\.com/i.test(url)) return false;
  if (/linkedin\.com\/jobs\/search/i.test(url)) return false;
  return true;
}

function resolveMonitorSource(item: {
  sourceType: string;
  sourceKey: string | null;
  applyUrl?: string | null;
}): { sourceType: string; sourceKey: string } | null {
  if (item.sourceType !== "manual" && item.sourceKey) {
    return { sourceType: item.sourceType, sourceKey: item.sourceKey };
  }
  const applyUrl = item.applyUrl?.trim();
  if (
    item.sourceType === "manual" &&
    applyUrl &&
    isScrapableCareersUrl(applyUrl)
  ) {
    return { sourceType: "careers-page", sourceKey: applyUrl };
  }
  return null;
}

/**
 * Fetch each unique board/API once per tick, then reuse the payload for every
 * role that shares that source (e.g. all Akuna watches → one Greenhouse call).
 */
export async function detectMany(
  items: Array<{
    id: string;
    sourceType: string;
    sourceKey: string | null;
    titleFilter: string | null;
    currentStatus: string;
    applyUrl?: string | null;
  }>,
): Promise<
  Map<
    string,
    {
      open: boolean;
      jobs: JobHit[];
      skipped?: boolean;
      fetchFailed?: boolean;
      boardKey?: string;
    }
  >
> {
  const results = new Map<
    string,
    {
      open: boolean;
      jobs: JobHit[];
      skipped?: boolean;
      fetchFailed?: boolean;
      boardKey?: string;
    }
  >();

  const resolved = new Map<
    string,
    { sourceType: string; sourceKey: string; titleFilter: string | null; currentStatus: string }
  >();

  for (const item of items) {
    const source = resolveMonitorSource(item);
    if (!source) {
      results.set(item.id, {
        open: item.currentStatus === "open",
        jobs: [],
        skipped: true,
      });
      continue;
    }
    resolved.set(item.id, {
      ...source,
      titleFilter: item.titleFilter,
      currentStatus: item.currentStatus,
    });
  }

  const boardKeys = [
    ...new Set(
      [...resolved.values()].map((i) =>
        sourceCacheKey(i.sourceType, i.sourceKey),
      ),
    ),
  ];

  const boardJobs = new Map<string, RawJob[] | null>();
  await Promise.all(
    boardKeys.map(async (key) => {
      const [sourceType, ...rest] = key.split(":");
      const sourceKey = rest.join(":");
      boardJobs.set(key, await fetchBoardJobs(sourceType, sourceKey));
    }),
  );

  for (const [id, item] of resolved) {
    const key = sourceCacheKey(item.sourceType, item.sourceKey);
    const raw = boardJobs.get(key);
    if (!raw) {
      // Fetch failed — leave status unchanged this tick.
      results.set(id, {
        open: item.currentStatus === "open",
        jobs: [],
        fetchFailed: true,
        boardKey: key,
      });
      continue;
    }
    const jobs = filterBoardJobs(
      raw,
      item.sourceType,
      item.sourceKey,
      item.titleFilter,
    );
    results.set(id, {
      open: jobs.length > 0,
      jobs,
      boardKey: key,
    });
  }

  return results;
}

export async function detectInternshipOpen(opts: {
  sourceType: string;
  sourceKey: string | null;
  titleFilter: string | null;
  currentStatus: string;
  applyUrl?: string | null;
}): Promise<{ open: boolean; jobs: JobHit[]; skipped?: boolean }> {
  const map = await detectMany([{ id: "_", ...opts }]);
  return map.get("_") ?? { open: opts.currentStatus === "open", jobs: [], skipped: true };
}

export type DiscoveredInternshipRole = {
  title: string;
  applyUrl: string;
  sourceType: "greenhouse" | "lever" | "ashby" | "careers-page";
  sourceKey: string;
  titleFilter: string;
  /** True when a live Summer 2027 US posting was found. */
  open: boolean;
};

function parseAtsFromUrl(
  url: string,
): { sourceType: "greenhouse" | "lever" | "ashby"; sourceKey: string } | null {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    const segments = u.pathname.split("/").filter(Boolean);

    // boards.greenhouse.io/{token} or job-boards.greenhouse.io/{token}
    if (
      host === "boards.greenhouse.io" ||
      host === "job-boards.greenhouse.io"
    ) {
      const token = segments[0];
      if (token && !["embed", "jobs", "gh_jid"].includes(token)) {
        return { sourceType: "greenhouse", sourceKey: token };
      }
    }

    const ghEmbed =
      u.searchParams.get("for") ||
      u.pathname.match(/\/(?:boards|v1\/boards)\/([a-z0-9_-]+)/i)?.[1];
    if (
      ghEmbed &&
      (host.includes("greenhouse.io") || host.includes("greenhouse.com"))
    ) {
      return { sourceType: "greenhouse", sourceKey: ghEmbed };
    }

    // jobs.lever.co/{token}
    if (host === "jobs.lever.co" || host.endsWith(".lever.co")) {
      const token = segments[0];
      if (token && token !== "api") {
        return { sourceType: "lever", sourceKey: token };
      }
    }

    // jobs.ashbyhq.com/{token}
    if (host === "jobs.ashbyhq.com" || host.endsWith(".ashbyhq.com")) {
      const token = segments[0];
      if (token && !["api", "posting-api"].includes(token)) {
        return { sourceType: "ashby", sourceKey: token };
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function companyBoardSlugCandidates(company: string): string[] {
  const raw = company.trim().toLowerCase();
  const compact = raw.replace(/[^a-z0-9]+/g, "");
  const dashed = raw
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const noSuffix = compact.replace(/(inc|llc|ltd|corp|co)$/i, "");
  return [...new Set([compact, dashed, noSuffix].filter((s) => s.length >= 2))];
}

async function resolveDiscoverySource(opts: {
  company: string;
  careersUrl?: string | null;
}): Promise<{
  sourceType: "greenhouse" | "lever" | "ashby" | "careers-page";
  sourceKey: string;
} | null> {
  const careersUrl = opts.careersUrl?.trim() || null;
  if (careersUrl) {
    const fromUrl = parseAtsFromUrl(careersUrl);
    if (fromUrl) return fromUrl;
    if (isScrapableCareersUrl(careersUrl)) {
      return { sourceType: "careers-page", sourceKey: careersUrl };
    }
  }

  // Probe common ATS boards by company slug when no usable careers URL.
  const candidates = companyBoardSlugCandidates(opts.company);
  for (const slug of candidates) {
    for (const sourceType of ["greenhouse", "lever", "ashby"] as const) {
      const jobs = await fetchBoardJobs(sourceType, slug);
      if (jobs && jobs.length > 0) {
        return { sourceType, sourceKey: slug };
      }
    }
  }
  return null;
}

function isUsInternshipJob(
  job: RawJob,
  sourceType: string,
  sourceKey: string,
): boolean {
  if (!isInternshipTitle(job.title)) return false;
  if (sourceType === "amazon" && !isUsCountryCode(job.countryCode)) return false;
  if (job.countryName) return isUsCountryName(job.countryName);
  return isUsLocationHint(...job.locationHints);
}

function extractInternLinksFromHtml(
  html: string,
  pageUrl: string,
): Array<{ title: string; absoluteUrl: string }> {
  const out: Array<{ title: string; absoluteUrl: string }> = [];
  const seen = new Set<string>();

  const re =
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const href = match[1];
    const text = match[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!isInternshipTitle(text) || text.length > 120) continue;
    let absoluteUrl = href;
    try {
      absoluteUrl = new URL(href, pageUrl).toString();
    } catch {
      continue;
    }
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ title: text, absoluteUrl });
  }

  return out;
}

/**
 * When a company request has no roles listed, scan ATS / careers pages for
 * US internship postings and return one row per role family.
 */
export async function discoverInternshipRoles(opts: {
  company: string;
  careersUrl?: string | null;
}): Promise<DiscoveredInternshipRole[]> {
  const source = await resolveDiscoverySource(opts);
  if (!source) return [];

  const nowOpenByFamily = new Map<
    string,
    { title: string; applyUrl: string; titleFilter: string }
  >();
  const offeredByFamily = new Map<
    string,
    { title: string; applyUrl: string; titleFilter: string }
  >();

  if (source.sourceType === "careers-page") {
    const raw = await fetchCareersPage(source.sourceKey);
    const html = raw?.[0]?.pageText ?? "";
    if (!html) return [];

    const links = extractInternLinksFromHtml(html, source.sourceKey);
    for (const link of links) {
      const family = cleanDiscoveredTitle(link.title);
      const key = family.toLowerCase();
      const titleFilter = titleFilterFromDiscovered(family);
      const row = {
        title: family,
        applyUrl: link.absoluteUrl,
        titleFilter,
      };
      offeredByFamily.set(key, row);
      if (matchesSummer2027(link.title) || matchesSummer2027(html)) {
        // Page-level Summer 2027 + specific intern link → treat as open.
        if (matchesSummer2027(link.title) || careersPageIsOpen(html, source.sourceKey, titleFilter)) {
          nowOpenByFamily.set(key, row);
        }
      }
    }

    // Fallback: page clearly has Summer 2027 internships but no parseable links.
    if (offeredByFamily.size === 0 && careersPageIsOpen(html, source.sourceKey, null)) {
      offeredByFamily.set("software engineering intern", {
        title: "Software Engineering Intern",
        applyUrl: source.sourceKey,
        titleFilter: "Software",
      });
      nowOpenByFamily.set("software engineering intern", {
        title: "Software Engineering Intern",
        applyUrl: source.sourceKey,
        titleFilter: "Software",
      });
    }
  } else {
    const raw = await fetchBoardJobs(source.sourceType, source.sourceKey);
    if (!raw) return [];

    for (const job of raw) {
      if (!isUsInternshipJob(job, source.sourceType, source.sourceKey)) continue;
      const family = cleanDiscoveredTitle(job.title);
      const key = family.toLowerCase();
      const applyUrl = job.absoluteUrl ?? boardFallbackUrl(source);
      const titleFilter = titleFilterFromDiscovered(family);
      const row = { title: family, applyUrl, titleFilter };
      if (!offeredByFamily.has(key)) offeredByFamily.set(key, row);
      if (isTargetRole(job.title, source.sourceKey)) {
        // Prefer a direct Summer 2027 posting URL when available.
        nowOpenByFamily.set(key, row);
      }
    }
  }

  const roles: DiscoveredInternshipRole[] = [];
  for (const [key, offered] of offeredByFamily) {
    const open = nowOpenByFamily.get(key);
    roles.push({
      title: (open ?? offered).title,
      applyUrl: (open ?? offered).applyUrl,
      sourceType: source.sourceType,
      sourceKey: source.sourceKey,
      titleFilter: (open ?? offered).titleFilter,
      open: Boolean(open),
    });
  }

  return roles.sort((a, b) => a.title.localeCompare(b.title));
}

function cleanDiscoveredTitle(title: string) {
  return roleFamilyTitle(title)
    .replace(/,\s*$/, "")
    .replace(/\s+,/g, ",")
    .trim();
}

function titleFilterFromDiscovered(familyTitle: string) {
  return (
    familyTitle
      .replace(/\b(?:summer\s*)?20\d{2}\b/gi, "")
      .replace(/\bintern(?:ship)?s?\b/gi, "")
      .replace(/\s+/g, " ")
      .trim() || familyTitle
  );
}

function boardFallbackUrl(source: {
  sourceType: "greenhouse" | "lever" | "ashby" | "careers-page";
  sourceKey: string;
}) {
  switch (source.sourceType) {
    case "greenhouse":
      return `https://boards.greenhouse.io/${source.sourceKey}`;
    case "lever":
      return `https://jobs.lever.co/${source.sourceKey}`;
    case "ashby":
      return `https://jobs.ashbyhq.com/${source.sourceKey}`;
    default:
      return source.sourceKey;
  }
}
