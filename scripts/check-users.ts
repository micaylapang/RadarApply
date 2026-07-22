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
  const { data: users, error } = await sb
    .from("users")
    .select("id, phone, name")
    .limit(10);
  if (error) {
    console.log("users query:", error.message);
    return;
  }
  console.log("users:", users?.length ?? 0);
  for (const u of users ?? []) {
    const p = String(u.phone || "");
    console.log("-", u.name, p.slice(0, 4) + "…" + p.slice(-2));
  }
  const { count } = await sb
    .from("subscriptions")
    .select("*", { count: "exact", head: true });
  console.log("subscriptions:", count ?? 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
