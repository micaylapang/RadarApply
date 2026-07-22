import { Resend } from "resend";
import { formatPhoneDisplay } from "@/lib/phone";

const DEFAULT_NOTIFY_TO = "radarapply@gmail.com";

/** Normalize env / paste values into a plain email FormSubmit & Resend accept. */
export function signupNotifyEmail() {
  const raw = (process.env.SIGNUP_NOTIFY_EMAIL?.trim() || DEFAULT_NOTIFY_TO)
    .replace(/^\uFEFF/, "");
  const angled = raw.match(/<([^>]+)>/);
  const candidate = (angled?.[1] ?? raw)
    .replace(/^["']+|["']+$/g, "")
    .trim()
    .toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) {
    console.warn(
      "[email] SIGNUP_NOTIFY_EMAIL is invalid; falling back to",
      DEFAULT_NOTIFY_TO,
    );
    return DEFAULT_NOTIFY_TO;
  }
  return candidate;
}

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function getResend() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function fromAddress() {
  return (
    process.env.EMAIL_FROM?.trim() ||
    "RadarApply <onboarding@resend.dev>"
  );
}

export type SignupAlertItem = {
  company: string;
  title: string;
};

/**
 * Ops email whenever someone signs up for (or adds) SMS alerts.
 * Prefer Resend when RESEND_API_KEY is set; otherwise FormSubmit (no key).
 * Failures are logged by the caller — never block signup.
 */
export async function sendNewSignupEmail(opts: {
  name: string;
  phone: string;
  alerts: SignupAlertItem[];
  isNewUser?: boolean;
}) {
  const to = signupNotifyEmail();
  const kind = opts.isNewUser === false ? "Added alerts" : "New signup";
  const headline =
    opts.isNewUser === false
      ? "RadarApply — alerts added"
      : "New RadarApply SMS signup";
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

  const htmlAlerts =
    opts.alerts.length === 0
      ? "<li>(none listed)</li>"
      : opts.alerts
          .map(
            (a) =>
              `<li><strong>${escapeHtml(a.company)}</strong> — ${escapeHtml(a.title)}</li>`,
          )
          .join("");

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;line-height:1.5;color:#111">
      <h2 style="margin:0 0 12px">${escapeHtml(headline)}</h2>
      <p style="margin:0 0 8px"><strong>Name:</strong> ${escapeHtml(opts.name)}</p>
      <p style="margin:0 0 16px"><strong>Phone:</strong> ${escapeHtml(phoneDisplay)}</p>
      <p style="margin:0 0 8px"><strong>Signed up for alerts:</strong></p>
      <ul style="margin:0;padding-left:1.25rem">${htmlAlerts}</ul>
    </div>
  `;

  const subject = `${kind}: ${opts.name} (${opts.alerts.length} alert${opts.alerts.length === 1 ? "" : "s"})`;

  const resend = getResend();
  if (resend) {
    const { error } = await resend.emails.send({
      from: fromAddress(),
      to: [to],
      subject,
      text,
      html,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const, via: "resend" as const };
  }

  // FormSubmit fallback (activate once via their confirmation email).
  // Put the readable body in `message` so Gmail shows name + alerts clearly.
  const res = await fetch(
    `https://formsubmit.co/ajax/${encodeURIComponent(to)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: "https://www.radarapply.com",
        Referer: "https://www.radarapply.com/",
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

  const body = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`FormSubmit failed (${res.status}): ${body.slice(0, 200)}`);
  }

  try {
    const parsed = JSON.parse(body) as { success?: string | boolean };
    if (parsed.success === false || parsed.success === "false") {
      throw new Error(`FormSubmit rejected: ${body.slice(0, 200)}`);
    }
  } catch (err) {
    if (err instanceof SyntaxError) {
      // Non-JSON success body is fine
    } else {
      throw err;
    }
  }

  return { ok: true as const, via: "formsubmit" as const };
}

/**
 * Ops email when someone requests a company (or roles) not yet on RadarApply.
 */
export async function sendCompanyRequestEmail(opts: {
  company: string;
  roles?: string;
  contact?: string;
}) {
  const primary = signupNotifyEmail();
  const recipients = Array.from(
    new Set([primary, DEFAULT_NOTIFY_TO].filter(Boolean)),
  );
  const roles = opts.roles?.trim() || "";
  const contact = opts.contact?.trim() || "";
  const subject = `Company request: ${opts.company}`;

  const text = [
    "RadarApply — company add request",
    "",
    `Company: ${opts.company}`,
    roles ? `Roles: ${roles}` : "Roles: (not specified)",
    contact ? `Contact: ${contact}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;line-height:1.5;color:#111">
      <h2 style="margin:0 0 12px">Company add request</h2>
      <p style="margin:0 0 8px"><strong>Company:</strong> ${escapeHtml(opts.company)}</p>
      <p style="margin:0 0 8px"><strong>Roles:</strong> ${escapeHtml(roles || "(not specified)")}</p>
      ${
        contact
          ? `<p style="margin:0"><strong>Contact:</strong> ${escapeHtml(contact)}</p>`
          : ""
      }
    </div>
  `;

  const resend = getResend();
  if (resend) {
    const { error } = await resend.emails.send({
      from: fromAddress(),
      to: recipients,
      subject,
      text,
      html,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const, via: "resend" as const };
  }

  const errors: string[] = [];
  for (const to of recipients) {
    try {
      await sendViaFormSubmit({
        to,
        subject,
        text,
        fields: {
          Company: opts.company,
          Roles: roles || "(not specified)",
          Contact: contact || "(none)",
        },
      });
      return { ok: true as const, via: "formsubmit" as const };
    } catch (err) {
      errors.push(
        `${to}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  throw new Error(errors.join(" | ") || "FormSubmit failed");
}

async function sendViaFormSubmit(opts: {
  to: string;
  subject: string;
  text: string;
  fields: Record<string, string>;
}) {
  const res = await fetch(
    `https://formsubmit.co/ajax/${encodeURIComponent(opts.to)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: "https://www.radarapply.com",
        Referer: "https://www.radarapply.com/",
        "User-Agent":
          "Mozilla/5.0 (compatible; RadarApply/1.0; +https://www.radarapply.com)",
      },
      body: JSON.stringify({
        _subject: opts.subject,
        _template: "box",
        _captcha: "false",
        _honey: "",
        ...opts.fields,
        message: opts.text,
      }),
    },
  );

  const body = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  try {
    const parsed = JSON.parse(body) as {
      success?: string | boolean;
      message?: string;
    };
    if (parsed.success === false || parsed.success === "false") {
      throw new Error(parsed.message || body.slice(0, 200));
    }
  } catch (err) {
    if (!(err instanceof SyntaxError)) throw err;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
