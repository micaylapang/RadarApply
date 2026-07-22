/**
 * Send the welcome SMS to every user currently in the DB (one-shot test).
 * Run: npx tsx scripts/send-welcome-all.ts
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { formatWelcomeSms, sendSms, smsConfigured } from "../src/lib/sms";

async function main() {
  if (!smsConfigured()) {
    console.error("Twilio is not configured");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing Supabase env");
    process.exit(1);
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data: users, error } = await sb.from("users").select("phone, name");
  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  console.log(`Sending welcome SMS to ${users?.length ?? 0} contact(s)…`);

  for (const user of users ?? []) {
    try {
      const result = await sendSms(user.phone, formatWelcomeSms(user.name));
      console.log(
        "✓",
        user.name,
        String(user.phone).slice(0, 4) + "…" + String(user.phone).slice(-2),
        result.sid,
      );
    } catch (err) {
      console.error(
        "✗",
        user.name,
        err instanceof Error ? err.message : err,
      );
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
