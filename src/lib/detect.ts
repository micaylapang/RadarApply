type JobHit = { title: string; absoluteUrl?: string };

async function fetchJson<T>(url: string, timeoutMs = 2500): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": "DropNotiMonitor/1.0" },
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

/** Greenhouse public boards API — fast JSON, ideal for 1s polling */
async function checkGreenhouse(
  board: string,
  titleFilter: string | null,
): Promise<{ open: boolean; jobs: JobHit[] }> {
  const data = await fetchJson<{ jobs?: Array<{ title: string; absolute_url?: string }> }>(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs`,
  );
  const jobs = (data?.jobs ?? [])
    .filter((j) => matchesFilter(j.title, titleFilter))
    .map((j) => ({ title: j.title, absoluteUrl: j.absolute_url }));
  return { open: jobs.length > 0, jobs };
}

/** Lever postings API */
async function checkLever(
  company: string,
  titleFilter: string | null,
): Promise<{ open: boolean; jobs: JobHit[] }> {
  const data = await fetchJson<Array<{ text: string; hostedUrl?: string }>>(
    `https://api.lever.co/v0/postings/${encodeURIComponent(company)}?mode=json`,
  );
  const jobs = (data ?? [])
    .filter((j) => matchesFilter(j.text, titleFilter))
    .map((j) => ({ title: j.text, absoluteUrl: j.hostedUrl }));
  return { open: jobs.length > 0, jobs };
}

/** Ashby public job board */
async function checkAshby(
  company: string,
  titleFilter: string | null,
): Promise<{ open: boolean; jobs: JobHit[] }> {
  const data = await fetchJson<{
    jobs?: Array<{ title: string; jobUrl?: string }>;
  }>(
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(company)}`,
  );
  const jobs = (data?.jobs ?? [])
    .filter((j) => matchesFilter(j.title, titleFilter))
    .map((j) => ({ title: j.title, absoluteUrl: j.jobUrl }));
  return { open: jobs.length > 0, jobs };
}

export async function detectInternshipOpen(opts: {
  sourceType: string;
  sourceKey: string | null;
  titleFilter: string | null;
  currentStatus: string;
}): Promise<{ open: boolean; jobs: JobHit[]; skipped?: boolean }> {
  if (opts.sourceType === "manual") {
    return { open: opts.currentStatus === "open", jobs: [], skipped: true };
  }
  if (!opts.sourceKey) {
    return { open: opts.currentStatus === "open", jobs: [], skipped: true };
  }

  switch (opts.sourceType) {
    case "greenhouse":
      return checkGreenhouse(opts.sourceKey, opts.titleFilter);
    case "lever":
      return checkLever(opts.sourceKey, opts.titleFilter);
    case "ashby":
      return checkAshby(opts.sourceKey, opts.titleFilter);
    default:
      return { open: opts.currentStatus === "open", jobs: [], skipped: true };
  }
}
