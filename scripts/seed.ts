import "dotenv/config";
import fs from "fs";
import path from "path";
import { INTERNSHIP_CATALOG } from "../src/lib/internships";
import {
  COMPANY_LOGOS,
  assertCompaniesHaveLogos,
} from "../src/lib/company-logos";
import { upsertInternshipCatalogItem } from "../src/lib/db";
import { getSupabaseAdmin, isSupabaseConfigured } from "../src/lib/supabase";

function assertLogoFilesOnDisk(companies: string[]) {
  assertCompaniesHaveLogos(companies);

  const placeholders: string[] = [];
  const absent: string[] = [];
  for (const company of [...new Set(companies)]) {
    const src = COMPANY_LOGOS[company]!.src;
    const filePath = path.join(process.cwd(), "public", src.replace(/^\//, ""));
    if (!fs.existsSync(filePath)) {
      absent.push(`${company} (${src})`);
      continue;
    }
    if (filePath.endsWith(".svg")) {
      const svg = fs.readFileSync(filePath, "utf8");
      if (/<text[\s>]/i.test(svg)) {
        placeholders.push(`${company} (${src})`);
      }
    }
  }
  if (absent.length > 0) {
    throw new Error(`Logo files missing on disk: ${absent.join(", ")}`);
  }
  if (placeholders.length > 0) {
    throw new Error(
      `Letter-tile placeholder logos (replace with real brand marks): ${placeholders.join(", ")}`,
    );
  }
}

async function main() {
  if (!isSupabaseConfigured()) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env",
    );
    process.exit(1);
  }

  assertLogoFilesOnDisk(INTERNSHIP_CATALOG.map((i) => i.company));

  for (const item of INTERNSHIP_CATALOG) {
    await upsertInternshipCatalogItem(item);
    console.log(`  ✓ ${item.company} — ${item.title}`);
  }

  // Drop catalog roles we no longer track (e.g. Two Sigma SWE not currently listed).
  // Keep roles added from approved company requests (managed_by = 'request').
  const keepSlugs = new Set(INTERNSHIP_CATALOG.map((i) => i.slug));
  const sb = getSupabaseAdmin();
  const { data: existing, error: listErr } = await sb
    .from("internships")
    .select("id, slug, company, title, managed_by");

  if (listErr) {
    // Older DBs may lack managed_by — still prune by slug, keep unknown extras.
    const fallback = await sb
      .from("internships")
      .select("id, slug, company, title");
    if (fallback.error) throw listErr;
    for (const row of fallback.data ?? []) {
      if (keepSlugs.has(row.slug)) continue;
      const { error } = await sb.from("internships").delete().eq("id", row.id);
      if (error) {
        console.warn(`  ! could not remove ${row.slug}: ${error.message}`);
      } else {
        console.log(`  − removed ${row.company} — ${row.title} (${row.slug})`);
      }
    }
  } else {
    for (const row of existing ?? []) {
      if (keepSlugs.has(row.slug)) continue;
      if ((row as { managed_by?: string }).managed_by === "request") {
        console.log(
          `  · keep request-added ${row.company} — ${row.title} (${row.slug})`,
        );
        continue;
      }
      const { error } = await sb.from("internships").delete().eq("id", row.id);
      if (error) {
        console.warn(`  ! could not remove ${row.slug}: ${error.message}`);
      } else {
        console.log(`  − removed ${row.company} — ${row.title} (${row.slug})`);
      }
    }
  }

  // Mark curated open roles with direct postings as open in the DB.
  const openSlugs = [
    "two-sigma-ai-research-intern",
    "two-sigma-qr-intern",
    "databricks-pm-intern",
    "jump-swe-intern",
    "jump-qr-intern",
    "jump-trader-intern",
    "akuna-swe-cpp-intern",
    "akuna-swe-python-intern",
    "akuna-swe-csharp-intern",
    "akuna-swe-fullstack-intern",
    "akuna-hardware-intern",
    "akuna-platform-intern",
    "akuna-qr-intern",
    "akuna-qd-intern",
    "imc-swe-intern",
    "imc-qr-intern",
    "imc-trader-intern",
    "imc-hardware-intern",
    "citadel-swe-intern",
    "citadel-qr-intern",
    "citadel-trading-intern",
    "kalshi-support-ops-intern",
    "optiver-swe-intern",
    "optiver-swe-intern-austin",
    "optiver-trading-ops-intern",
    "optiver-quantitative-intern",
    "optiver-fpga-intern",
    "optiver-fpga-intern-chicago",
    "deshaw-swe-intern",
    "deshaw-qr-intern",
    "hrt-swe-intern",
    "hrt-algo-intern",
    "jane-street-qr-intern",
    "jane-street-trading-intern",
    "google-swe-intern",
    "palantir-swe-intern-denver",
    "palantir-swe-intern",
    "palantir-swe-intern-palo-alto",
    "palantir-swe-intern-dc",
    "palantir-swe-defense-nyc",
    "palantir-swe-defense-palo-alto",
    "palantir-swe-defense-dc",
    "palantir-swe-infra-nyc",
    "palantir-swe-infra-palo-alto",
    "palantir-swe-prod-infra-nyc",
    "palantir-swe-prod-infra-seattle",
    "palantir-swe-prod-infra-dc",
    "palantir-pcl-swe-intern-nyc",
    "palantir-fde-commercial-chicago",
    "palantir-fde-intern",
    "palantir-fde-defense-dc",
    "palantir-fde-france-nyc",
    "palantir-fde-intel-dc",
    "palantir-fde-poland-nyc",
    "palantir-fde-usg-honolulu",
    "palantir-fde-usg-nyc",
    "palantir-fde-usg-dc",
    "palantir-fdie-usg-nyc",
    "palantir-fdie-usg-palo-alto",
    "palantir-fdie-usg-dc",
    "palantir-ds-usg-honolulu",
    "palantir-yap-fde-commercial-chicago",
    "palantir-yap-fde-commercial-nyc",
    "palantir-yap-fde-usg-nyc",
    "palantir-yap-fde-usg-dc",
    "palantir-yap-swe-nyc",
    "apple-swe-intern",
    "apple-ml-intern",
    "apple-hardware-intern",
    "apple-hardware-tech-intern",
    "apple-product-design-intern",
    "apple-ops-mfg-design-intern",
    "apple-epm-intern",
    "apple-bmc-intern",
    "scale-ai-builder-intern",
  ];
  for (const slug of openSlugs) {
    const { error } = await sb
      .from("internships")
      .update({ status: "open", opened_at: null })
      .eq("slug", slug)
      .neq("status", "open");
    if (error) console.warn(`  ! open ${slug}: ${error.message}`);
  }

  // Neuralink is Fall 2026 only — keep on watchlist until Summer 2027 opens.
  {
    const { error } = await sb
      .from("internships")
      .update({ status: "closed", opened_at: null })
      .eq("company", "Neuralink")
      .neq("status", "closed");
    if (error) console.warn(`  ! close Neuralink: ${error.message}`);
    else console.log("  ✓ Neuralink forced closed (Fall 2026 watchlist)");
  }

  console.log(`\nSeeded ${INTERNSHIP_CATALOG.length} internships into Supabase`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
