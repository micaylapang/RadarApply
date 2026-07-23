/**
 * Smoke-test Google Careers scraper locally.
 * Run: npx tsx scripts/test-google-scraper.ts
 */
import { detectInternshipOpen } from "../src/lib/detect";

async function main() {
  const cases = [
    {
      label: "SWE",
      sourceKey: "Software Engineering Intern Summer 2027",
      titleFilter: "Software Engineering Intern",
    },
    {
      label: "STEP",
      sourceKey: "STEP Intern Summer 2027",
      titleFilter: "STEP",
    },
    {
      label: "Data",
      sourceKey: "Data Science Intern Summer 2027",
      titleFilter: "Data Science Intern",
    },
  ];

  for (const c of cases) {
    const result = await detectInternshipOpen({
      sourceType: "google",
      sourceKey: c.sourceKey,
      titleFilter: c.titleFilter,
      currentStatus: "closed",
    });
    console.log(`\n[${c.label}] open=${result.open} skipped=${Boolean(result.skipped)} hits=${result.jobs.length}`);
    for (const j of result.jobs.slice(0, 5)) {
      console.log(`  • ${j.title}`);
      console.log(`    ${j.absoluteUrl}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
