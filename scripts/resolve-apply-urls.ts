/**
 * Resolve direct apply URLs for Greenhouse / Ashby / Amazon catalog watches.
 * Run: npx tsx scripts/resolve-apply-urls.ts
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { INTERNSHIP_CATALOG } from "../src/lib/internships";
import { matchesSummer2027 } from "../src/lib/role-meta";
import { isUsCountryCode, isUsCountryName, isUsLocationHint } from "../src/lib/location";
import { getSupabaseAdmin } from "../src/lib/supabase";
import { isSupabaseConfigured } from "../src/lib/supabase";

type Hit = { title: string; url: string; location?: string };

function isInternshipTitle(title: string) {
  const t = title.toLowerCase();
  return (
    t.includes("intern") ||
    t.includes("internship") ||
    t.includes("co-op") ||
    t.includes("coop")
  );
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
      signal: AbortSignal.timeout(12000),
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
  }>(
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(company)}`,
  );
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

async function resolveForItem(item: (typeof INTERNSHIP_CATALOG)[number]): Promise<string | null> {
  let hits: Hit[] = [];
  if (item.sourceType === "greenhouse" && item.sourceKey) {
    hits = await greenhouseHits(item.sourceKey);
  } else if (item.sourceType === "ashby" && item.sourceKey) {
    hits = await ashbyHits(item.sourceKey);
  } else if (item.sourceType === "amazon" && item.sourceKey) {
    hits = await amazonHits(item.sourceKey);
  } else {
    return null;
  }

  const filtered = hits.filter((h) => matchesFilter(h.title, item.titleFilter));
  return filtered[0]?.url ?? null;
}

async function main() {
  const updates: Array<{ slug: string; company: string; title: string; url: string }> =
    [];

  for (const item of INTERNSHIP_CATALOG) {
    const url = await resolveForItem(item);
    if (!url) {
      console.log(`  · ${item.slug} — no live direct URL yet`);
      continue;
    }
    if (url === item.applyUrl) {
      console.log(`  = ${item.slug} — already direct`);
      continue;
    }
    updates.push({
      slug: item.slug,
      company: item.company,
      title: item.title,
      url,
    });
    console.log(`  ✓ ${item.slug}`);
    console.log(`      ${url}`);
  }

  // Patch internships.ts applyUrl strings for resolved slugs
  const catalogPath = path.join(process.cwd(), "src/lib/internships.ts");
  let src = fs.readFileSync(catalogPath, "utf8");

  for (const u of updates) {
    // Replace applyUrl in the block that contains this slug
    const slugRe = new RegExp(
      `(slug:\\s*"${u.slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[\\s\\S]*?applyUrl:\\s*)("[^"]*"|\\n\\s*"[^"]*")`,
      "m",
    );
    // simpler: find slug then nearby applyUrl is messy because applyUrl comes BEFORE slug in catalog
    // Catalog order is: title, slug, description, applyUrl
    // So find slug then go backwards - instead replace by unique slug context after applyUrl

    const blockRe = new RegExp(
      `({\\s*company:[\\s\\S]*?slug:\\s*"${u.slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[\\s\\S]*?applyUrl:\\s*)("[^"]*")`,
      "m",
    );
    // applyUrl is BEFORE slug in file. Order: company, title, slug, description, applyUrl
    const fwd = new RegExp(
      `(slug:\\s*"${u.slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}",\\s*description:\\s*"[^"]*",\\s*applyUrl:\\s*)("[^"]*"|\\n\\s*"[^"]*")`,
      "m",
    );
    if (fwd.test(src)) {
      src = src.replace(fwd, `$1"${u.url}"`);
    } else {
      // multiline applyUrl
      const multi = new RegExp(
        `(slug:\\s*"${u.slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}",\\s*description:\\s*"[^"]*",\\s*applyUrl:\\s*)\\n?\\s*"[^"]*"`,
        "m",
      );
      if (multi.test(src)) {
        src = src.replace(multi, `$1\n      "${u.url}"`);
      } else {
        console.warn(`  ! could not patch file for ${u.slug}`);
      }
    }
  }

  fs.writeFileSync(catalogPath, src);

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    for (const u of updates) {
      const { error } = await sb
        .from("internships")
        .update({ apply_url: u.url })
        .eq("slug", u.slug);
      if (error) console.error("DB", u.slug, error.message);
      else console.log(`  DB ← ${u.slug}`);
    }
  }

  console.log(`\nResolved ${updates.length} direct apply URLs`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
