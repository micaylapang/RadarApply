import {
  matchesSummer2027,
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
