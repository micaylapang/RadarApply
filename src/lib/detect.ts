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
};

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
    default:
      return null;
  }
}

function filterBoardJobs(
  raw: RawJob[],
  sourceType: string,
  sourceKey: string,
  titleFilter: string | null,
): JobHit[] {
  return raw
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
  }>,
): Promise<
  Map<
    string,
    { open: boolean; jobs: JobHit[]; skipped?: boolean; boardKey?: string }
  >
> {
  const results = new Map<
    string,
    { open: boolean; jobs: JobHit[]; skipped?: boolean; boardKey?: string }
  >();

  const fetchable = items.filter(
    (i) => i.sourceType !== "manual" && Boolean(i.sourceKey),
  );
  const skipped = items.filter(
    (i) => i.sourceType === "manual" || !i.sourceKey,
  );

  for (const item of skipped) {
    results.set(item.id, {
      open: item.currentStatus === "open",
      jobs: [],
      skipped: true,
    });
  }

  const boardKeys = [
    ...new Set(
      fetchable.map((i) => sourceCacheKey(i.sourceType, i.sourceKey!)),
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

  for (const item of fetchable) {
    const key = sourceCacheKey(item.sourceType, item.sourceKey!);
    const raw = boardJobs.get(key);
    if (!raw) {
      // Fetch failed — leave status unchanged this tick.
      results.set(item.id, {
        open: item.currentStatus === "open",
        jobs: [],
        skipped: true,
        boardKey: key,
      });
      continue;
    }
    const jobs = filterBoardJobs(
      raw,
      item.sourceType,
      item.sourceKey!,
      item.titleFilter,
    );
    results.set(item.id, {
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
}): Promise<{ open: boolean; jobs: JobHit[]; skipped?: boolean }> {
  const map = await detectMany([{ id: "_", ...opts }]);
  return map.get("_") ?? { open: opts.currentStatus === "open", jobs: [], skipped: true };
}
