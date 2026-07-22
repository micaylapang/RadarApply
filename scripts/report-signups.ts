import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing Supabase env");
    process.exit(1);
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: users, error: usersError } = await sb
    .from("users")
    .select("id, name, phone, created_at")
    .order("created_at", { ascending: false });
  if (usersError) throw usersError;

  const { data: subs, error: subsError } = await sb
    .from("subscriptions")
    .select("user_id, internships ( company, title, status )");
  if (subsError) throw subsError;

  type SubJoin = {
    user_id: string;
    internships: { company: string; title: string; status: string } | null;
  };

  const byUser = new Map<string, Array<{ company: string; title: string }>>();
  const byCompany = new Map<string, number>();
  const byRole = new Map<string, number>();

  for (const row of (subs ?? []) as unknown as SubJoin[]) {
    const intern = row.internships;
    if (!intern) continue;
    const list = byUser.get(row.user_id) ?? [];
    list.push({ company: intern.company, title: intern.title });
    byUser.set(row.user_id, list);
    byCompany.set(intern.company, (byCompany.get(intern.company) ?? 0) + 1);
    const roleKey = `${intern.company} — ${intern.title}`;
    byRole.set(roleKey, (byRole.get(roleKey) ?? 0) + 1);
  }

  console.log(`\nUsers: ${users?.length ?? 0}`);
  console.log(`Subscriptions: ${subs?.length ?? 0}\n`);

  for (const user of users ?? []) {
    const watches = byUser.get(user.id) ?? [];
    console.log(`${user.name}  ${user.phone}  (${watches.length} watches)`);
    for (const w of watches.sort((a, b) =>
      a.company === b.company
        ? a.title.localeCompare(b.title)
        : a.company.localeCompare(b.company),
    )) {
      console.log(`  • ${w.company} — ${w.title}`);
    }
    console.log("");
  }

  console.log("By company:");
  for (const [company, count] of [...byCompany.entries()].sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${count}\t${company}`);
  }

  console.log("\nBy role:");
  for (const [role, count] of [...byRole.entries()].sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${count}\t${role}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
