import "dotenv/config";
import { INTERNSHIP_CATALOG } from "../src/lib/internships";
import { upsertInternshipCatalogItem } from "../src/lib/db";
import { isSupabaseConfigured } from "../src/lib/supabase";

async function main() {
  if (!isSupabaseConfigured()) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env",
    );
    process.exit(1);
  }

  for (const item of INTERNSHIP_CATALOG) {
    await upsertInternshipCatalogItem(item);
    console.log(`  ✓ ${item.company} — ${item.title}`);
  }

  console.log(`\nSeeded ${INTERNSHIP_CATALOG.length} internships into Supabase`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
