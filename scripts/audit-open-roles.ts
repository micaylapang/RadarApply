/**
 * Scan all pollable catalog boards for live Summer 2027 US intern postings.
 * Run: npx tsx scripts/audit-open-roles.ts
 */
import "dotenv/config";
import { INTERNSHIP_CATALOG } from "../src/lib/internships";
import { COMPANY_DROP_STATUS } from "../src/lib/company-status";
import { isDirectApplyUrl } from "../src/lib/apply-url";
import { matchesSummer2027 } from "../src/lib/role-meta";
import {
  isUsCountryCode,
  isUsCountryName,
  isUsLocationHint,
} from "../src/lib/location";

type Hit = { title: string; url: string; location?: string };

function isInternshipTitle(title: string) {
  return /\b(intern(?:ship)?s?|co-?op)\b/i.test(title);
}

function matchesFilter(title: string, filter: string | null) {
  if (!filter) return true;
  return title.toLowerCase().includes(filter.toLowerCase());
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "RadarApplyMonitor/1.0",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function greenhouseHits(board: string): Promise<Hit[]> {
  const data = await fetchJson<{
    jobs?: Array<{
      title: string;
      absolute_url?: string;
      location?: { name?: string };
    }>;
  }>(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs`);
  return (data?.jobs ?? [])
    .filter((j) => isInternshipTitle(j.title) && matchesSummer2027(j.title))
    .filter((j) => isUsLocationHint(j.location?.name, j.title))
    .map((j) => ({
      title: j.title,
      url: j.absolute_url ?? "",
      location: j.location?.name,
    }))
    .filter((j) => j.url);
}

async function ashbyHits(company: string): Promise<Hit[]> {
  const data = await fetchJson<{
    jobs?: Array<{
      title: string;
      jobUrl?: string;
      location?: string;
      secondaryLocations?: string[];
      address?: { postalAddress?: { addressCountry?: string } };
    }>;
  }>(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(company)}`);
  return (data?.jobs ?? [])
    .filter((j) => isInternshipTitle(j.title) && matchesSummer2027(j.title))
    .filter((j) => {
      const country = j.address?.postalAddress?.addressCountry;
      if (country) return isUsCountryName(country);
      return isUsLocationHint(j.location, ...(j.secondaryLocations ?? []), j.title);
    })
    .map((j) => ({
      title: j.title,
      url: j.jobUrl ?? "",
      location: j.location,
    }))
    .filter((j) => j.url);
}

async function amazonHits(query: string): Promise<Hit[]> {
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
  }>(`https://www.amazon.jobs/en/search.json?${params}`);
  return (data?.jobs ?? [])
    .filter((j) => isUsCountryCode(j.country_code))
    .filter((j) => {
      const title = j.title ?? "";
      return (
        isInternshipTitle(title) &&
        matchesSummer2027(title) &&
        isUsLocationHint(title, j.city, j.location_name)
      );
    })
    .map((j) => ({
      title: j.title ?? "",
      url: j.job_path ? `https://www.amazon.jobs${j.job_path}` : "",
    }))
    .filter((j) => j.url);
}

async function boardHits(
  sourceType: string,
  sourceKey: string | null,
): Promise<Hit[]> {
  if (!sourceKey) return [];
  if (sourceType === "greenhouse") return greenhouseHits(sourceKey);
  if (sourceType === "ashby") return ashbyHits(sourceKey);
  if (sourceType === "amazon") return amazonHits(sourceKey);
  return [];
}

async function main() {
  const boards = new Map<string, { type: string; key: string }>();
  for (const item of INTERNSHIP_CATALOG) {
    if (item.sourceKey && item.sourceType !== "manual") {
      boards.set(`${item.sourceType}:${item.sourceKey}`, {
        type: item.sourceType,
        key: item.sourceKey,
      });
    }
  }

  console.log("=== Live Summer 2027 US intern postings by board ===\n");

  const liveByBoard = new Map<string, Hit[]>();
  for (const [id, { type, key }] of boards) {
    const hits = await boardHits(type, key);
    liveByBoard.set(id, hits);
    if (hits.length > 0) {
      console.log(`\n${id} (${hits.length} hits):`);
      for (const h of hits) {
        console.log(`  • ${h.title}`);
        console.log(`    ${h.url}`);
        if (h.location) console.log(`    @ ${h.location}`);
      }
    } else {
      console.log(`${id}: (none)`);
    }
  }

  console.log("\n\n=== Catalog slug matches ===\n");

  const newlyOpen: Array<{
    slug: string;
    company: string;
    title: string;
    url: string;
    curated: string;
  }> = [];

  for (const item of INTERNSHIP_CATALOG) {
    const id = `${item.sourceType}:${item.sourceKey ?? ""}`;
    const hits =
      item.sourceKey && item.sourceType !== "manual"
        ? (liveByBoard.get(id) ?? [])
        : [];

    const match = hits.find((h) => matchesFilter(h.title, item.titleFilter));
    const curated = COMPANY_DROP_STATUS[item.company] ?? "waiting";
    const hasDirect = match ? isDirectApplyUrl(match.url) : isDirectApplyUrl(item.applyUrl);

    if (match && hasDirect) {
      const status =
        curated === "open"
          ? "already-open"
          : curated === "soon"
            ? "soon→should-open"
            : "NEW";
      console.log(`[${status}] ${item.slug}`);
      console.log(`  match: ${match.title}`);
      console.log(`  url:   ${match.url}`);
      if (curated !== "open") {
        newlyOpen.push({
          slug: item.slug,
          company: item.company,
          title: item.title,
          url: match.url,
          curated,
        });
      }
    }
  }

  console.log("\n\n=== Summary: waiting/soon roles with live Summer 2027 postings ===\n");
  if (newlyOpen.length === 0) {
    console.log("(none beyond already-marked-open companies)");
  } else {
    const byCompany = new Map<string, typeof newlyOpen>();
    for (const r of newlyOpen) {
      const list = byCompany.get(r.company) ?? [];
      list.push(r);
      byCompany.set(r.company, list);
    }
    for (const [company, roles] of byCompany) {
      console.log(`\n${company}:`);
      for (const r of roles) {
        console.log(`  ${r.slug} — ${r.url}`);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
