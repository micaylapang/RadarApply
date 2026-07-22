import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { INTERNSHIP_CATALOG } from "../src/lib/internships";
import { companyDropStatus } from "../src/lib/company-status";

async function main() {
  const byCompany = new Map<string, string[]>();
  for (const item of INTERNSHIP_CATALOG) {
    const list = byCompany.get(item.company) ?? [];
    list.push(item.title);
    byCompany.set(item.company, list);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data: rows } = await sb
    .from("internships")
    .select("company, title, status");

  const liveByCompany = new Map<
    string,
    Array<{ title: string; status: string }>
  >();
  for (const r of rows ?? []) {
    const list = liveByCompany.get(r.company) ?? [];
    list.push({ title: r.title, status: r.status });
    liveByCompany.set(r.company, list);
  }

  const open: string[] = [];
  const soon: string[] = [];
  const waiting: string[] = [];

  for (const company of [...byCompany.keys()].sort((a, b) =>
    a.localeCompare(b),
  )) {
    const live = liveByCompany.get(company) ?? [];
    const drop = companyDropStatus(
      company,
      live.map((r) => ({ status: r.status, openedAt: null })),
    );
    if (drop === "open") open.push(company);
    else if (drop === "soon") soon.push(company);
    else waiting.push(company);
  }

  console.log(`Companies: ${byCompany.size}`);
  console.log(`Roles: ${INTERNSHIP_CATALOG.length}`);
  console.log("");
  console.log(`OPEN (${open.length})`);
  for (const c of open) {
    const liveOpen = (liveByCompany.get(c) ?? []).filter(
      (r) => r.status === "open",
    );
    console.log(`  ${c}`);
    if (liveOpen.length) {
      for (const r of liveOpen) console.log(`    - ${r.title}`);
    } else {
      for (const t of byCompany.get(c) ?? []) console.log(`    - ${t}`);
    }
  }
  console.log("");
  console.log(`OPENING SOON (${soon.length})`);
  for (const c of soon) {
    console.log(`  ${c}`);
    for (const t of byCompany.get(c) ?? []) console.log(`    - ${t}`);
  }
  console.log("");
  console.log(`WAITING (${waiting.length})`);
  for (const c of waiting) {
    console.log(`  ${c}`);
    for (const t of byCompany.get(c) ?? []) console.log(`    - ${t}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
