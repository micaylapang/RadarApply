/**
 * Browser-side ops notify via FormSubmit.
 * Vercel serverless IPs get Cloudflare-blocked by FormSubmit; the user's
 * browser Origin works.
 */

import { formatPhoneDisplay } from "@/lib/phone";

const OPS_EMAIL = "radarapply@gmail.com";

export type OpsAlertItem = {
  company: string;
  title: string;
};

export async function notifySignupFromBrowser(opts: {
  name: string;
  phone: string;
  alerts: OpsAlertItem[];
  isNewUser?: boolean;
}): Promise<boolean> {
  // New account signups only — never email when someone adds more roles.
  if (opts.isNewUser !== true) return false;

  const headline = "New RadarApply SMS signup";
  const phoneDisplay = formatPhoneDisplay(opts.phone);

  const alertLines =
    opts.alerts.length === 0
      ? ["(none listed)"]
      : opts.alerts.map((a) => `• ${a.company} — ${a.title}`);

  const text = [
    headline,
    "",
    `Name: ${opts.name}`,
    `Phone: ${phoneDisplay}`,
    "",
    "Signed up for alerts:",
    ...alertLines,
  ].join("\n");

  const subject = `New signup: ${opts.name} (${opts.alerts.length} alert${
    opts.alerts.length === 1 ? "" : "s"
  })`;

  try {
    const res = await fetch(
      `https://formsubmit.co/ajax/${encodeURIComponent(OPS_EMAIL)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          _subject: subject,
          _template: "box",
          _captcha: "false",
          Name: opts.name,
          Phone: phoneDisplay,
          "Alert count": String(opts.alerts.length),
          Alerts: alertLines.join("\n"),
          message: text,
        }),
      },
    );
    const body = await res.text();
    if (!res.ok) return false;
    try {
      const parsed = JSON.parse(body) as { success?: string | boolean };
      if (parsed.success === false || parsed.success === "false") return false;
    } catch {
      // non-JSON success is fine
    }
    return true;
  } catch {
    return false;
  }
}
