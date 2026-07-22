/**
 * Append signup / alert-add rows to Google Sheets via an Apps Script web app.
 *
 * Setup (one-time):
 * 1. Create a Google Sheet (e.g. "RadarApply Signups")
 * 2. Row 1 headers: Timestamp | Name | Phone | Event | Roles | Count
 * 3. Extensions → Apps Script → paste the script from
 *    scripts/google-sheets-signup-webhook.gs → Deploy → New deployment
 *    → Type: Web app → Execute as: Me → Who has access: Anyone
 * 4. Copy the web app URL into Vercel env GOOGLE_SHEETS_WEBHOOK_URL
 * 5. Optional: set GOOGLE_SHEETS_WEBHOOK_SECRET and the same value in the script
 */

import { formatPhoneDisplay } from "@/lib/phone";

export type SheetAlertItem = {
  company: string;
  title: string;
};

export function googleSheetsWebhookConfigured() {
  return Boolean(process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim());
}

export async function appendSignupToGoogleSheet(opts: {
  name: string;
  phone: string;
  isNewUser: boolean;
  alerts: SheetAlertItem[];
}): Promise<{ ok: boolean; skipped?: boolean }> {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim();
  if (!url) return { ok: false, skipped: true };

  const secret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim() || "";
  const roles = opts.alerts
    .map((a) => `${a.company} — ${a.title}`)
    .join("\n");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret,
      timestamp: new Date().toISOString(),
      name: opts.name,
      phone: formatPhoneDisplay(opts.phone),
      event: opts.isNewUser ? "new_signup" : "added_alerts",
      roles,
      count: opts.alerts.length,
      alerts: opts.alerts,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google Sheets webhook ${res.status}: ${body.slice(0, 200)}`);
  }

  return { ok: true };
}
