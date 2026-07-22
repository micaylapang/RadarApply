/**
 * One-shot live SMS smoke test to the first user in the DB.
 * Run: npx tsx scripts/send-live-test.ts
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { sendSms, smsConfigured } from "../src/lib/sms";

async function main() {
  if (!smsConfigured()) {
    console.error("Twilio is not configured");
    process.exit(1);
  }
  if (process.env.TWILIO_TRIAL_MODE === "true") {
    console.error("TWILIO_TRIAL_MODE is still true — refuse to send live test");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing Supabase env");
    process.exit(1);
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data: users, error } = await sb
    .from("users")
    .select("phone, name")
    .limit(1);
  if (error || !users?.length) {
    console.error("No users to text:", error?.message ?? "empty");
    process.exit(1);
  }

  const user = users[0];
  const body =
    "RadarApply is LIVE. You’ll get a text the moment a tracked internship opens. Reply STOP to cancel.";
  const result = await sendSms(user.phone, body);
  console.log("sent to", String(user.name), "sid=", result.sid, "trial=", result.trial, "mocked=", result.mocked);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
