/**
 * One-shot: alert everyone watching Google SWE Intern that Summer 2027 dropped.
 * Run: npx tsx scripts/alert-google-swe-drop.ts
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { formatPhoneDisplay } from "../src/lib/phone";
import { friendlySmsError, sendSms, smsConfigured } from "../src/lib/sms";

const APPLY_URL =
  "https://www.google.com/about/careers/applications/jobs/results/85564713261245126-software-engineering-intern-bs-summer-2027";

const MESSAGE = `Google SWE Internships for Summer 2027 just dropped. 🔥 Go apply now! ${APPLY_URL}`;

async function main() {
  if (!smsConfigured()) {
    console.error("Twilio is not configured");
    process.exit(1);
  }
  if (process.env.TWILIO_TRIAL_MODE === "true") {
    console.error("TWILIO_TRIAL_MODE=true — refuse to send live alerts");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing Supabase env");
    process.exit(1);
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: roles, error: rolesError } = await sb
    .from("internships")
    .select("id, company, title, slug, status, apply_url")
    .eq("company", "Google")
    .ilike("title", "%Software Engineering Intern%");

  if (rolesError) throw rolesError;
  if (!roles?.length) {
    console.error("No Google Software Engineering Intern role found");
    process.exit(1);
  }

  const internship = roles.find((r) =>
    /software engineering intern/i.test(r.title),
  );
  if (!internship) {
    console.error("Could not match Google SWE role among:", roles);
    process.exit(1);
  }

  console.log(
    `Target: ${internship.company} — ${internship.title} (${internship.id})`,
  );
  console.log(`Previous status: ${internship.status}`);
  console.log(`Message:\n${MESSAGE}\n`);

  const { data: subs, error: subsError } = await sb
    .from("subscriptions")
    .select("id, user_id, alerted_at, users ( id, name, phone )")
    .eq("internship_id", internship.id);

  if (subsError) throw subsError;

  type SubRow = {
    id: string;
    user_id: string;
    alerted_at: string | null;
    users: { id: string; name: string; phone: string } | null;
  };

  const subscribers = ((subs ?? []) as unknown as SubRow[])
    .map((row) => ({
      subscriptionId: row.id,
      userId: row.user_id,
      previouslyAlerted: Boolean(row.alerted_at),
      name: row.users?.name ?? "(unknown)",
      phone: row.users?.phone ?? "",
    }))
    .filter((s) => s.phone);

  // Dedupe by phone in case of duplicate rows
  const byPhone = new Map<string, (typeof subscribers)[number]>();
  for (const s of subscribers) {
    if (!byPhone.has(s.phone)) byPhone.set(s.phone, s);
  }
  const unique = [...byPhone.values()];

  console.log(`Subscribers to text: ${unique.length}\n`);

  const now = new Date().toISOString();
  const { error: updateError } = await sb
    .from("internships")
    .update({
      status: "open",
      opened_at: now,
      last_checked: now,
      apply_url: APPLY_URL,
    })
    .eq("id", internship.id);
  if (updateError) throw updateError;

  const report: Array<{
    name: string;
    phone: string;
    phoneDisplay: string;
    status: "sent" | "failed";
    sid?: string;
    error?: string;
  }> = [];

  for (const sub of unique) {
    const started = Date.now();
    try {
      const result = await sendSms(sub.phone, MESSAGE);
      await sb
        .from("subscriptions")
        .update({ alerted_at: now })
        .eq("id", sub.subscriptionId);
      await sb.from("alerts").insert({
        user_id: sub.userId,
        internship_id: internship.id,
        phone: sub.phone,
        body: MESSAGE,
        status: "sent",
        latency_ms: Date.now() - started,
      });
      report.push({
        name: sub.name,
        phone: sub.phone,
        phoneDisplay: formatPhoneDisplay(sub.phone),
        status: "sent",
        sid: result.sid,
      });
      console.log(`✓ ${sub.name}  ${formatPhoneDisplay(sub.phone)}  ${result.sid}`);
    } catch (err) {
      const friendly = friendlySmsError(err);
      await sb.from("alerts").insert({
        user_id: sub.userId,
        internship_id: internship.id,
        phone: sub.phone,
        body: MESSAGE,
        status: "failed",
        latency_ms: Date.now() - started,
      });
      report.push({
        name: sub.name,
        phone: sub.phone,
        phoneDisplay: formatPhoneDisplay(sub.phone),
        status: "failed",
        error: friendly,
      });
      console.error(`✗ ${sub.name}  ${formatPhoneDisplay(sub.phone)}  ${friendly}`);
    }
  }

  const sent = report.filter((r) => r.status === "sent");
  const failed = report.filter((r) => r.status === "failed");

  console.log("\n========== REPORT ==========");
  console.log(`Role: Google — ${internship.title}`);
  console.log(`Apply: ${APPLY_URL}`);
  console.log(`Sent: ${sent.length}  Failed: ${failed.length}`);
  console.log("\nDelivered to:");
  for (const r of sent) {
    console.log(`  • ${r.name} — ${r.phoneDisplay}`);
  }
  if (failed.length) {
    console.log("\nFailed:");
    for (const r of failed) {
      console.log(`  • ${r.name} — ${r.phoneDisplay} — ${r.error}`);
    }
  }
  console.log("============================\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
