import twilio from "twilio";
import { isDirectApplyUrl } from "@/lib/apply-url";

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
}

export function smsConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER,
  );
}

/** Twilio trial accounts cannot send custom bodies — only these template keys. */
const TRIAL_TEMPLATE =
  process.env.TWILIO_TRIAL_TEMPLATE ?? "sms_event_notifications";

function isTrialTemplateError(err: unknown) {
  const code = (err as { code?: number })?.code;
  return code === 572006;
}

function isUnverifiedRecipientError(err: unknown) {
  const code = (err as { code?: number })?.code;
  return code === 572002 || code === 21608 || code === 21265;
}

export function friendlySmsError(err: unknown): string {
  if (isUnverifiedRecipientError(err)) {
    return "Twilio couldn’t deliver to that number. Check the number format and your Twilio Messaging / A2P setup.";
  }
  if (isTrialTemplateError(err)) {
    return "Twilio blocked the message body. Confirm the account is upgraded and TWILIO_TRIAL_MODE=false.";
  }
  const message = err instanceof Error ? err.message : "SMS failed";
  return message;
}

export async function sendSms(to: string, body: string) {
  const from = process.env.TWILIO_FROM_NUMBER;
  const client = getClient();

  if (!client || !from) {
    console.warn("[sms] Twilio not configured — logging message instead");
    console.warn(`[sms] → ${to}: ${body}`);
    return { sid: `dev_${Date.now()}`, mocked: true as const, trial: false };
  }

  const forceTrial = process.env.TWILIO_TRIAL_MODE === "true";

  try {
    const message = await client.messages.create({
      to,
      from,
      body: forceTrial ? TRIAL_TEMPLATE : body,
    });
    return {
      sid: message.sid,
      mocked: false as const,
      trial: forceTrial,
    };
  } catch (err) {
    if (!forceTrial && isTrialTemplateError(err)) {
      console.warn(
        `[sms] Trial restriction — retrying with template ${TRIAL_TEMPLATE}`,
      );
      const message = await client.messages.create({
        to,
        from,
        body: TRIAL_TEMPLATE,
      });
      return {
        sid: message.sid,
        mocked: false as const,
        trial: true,
      };
    }
    throw err;
  }
}

export function formatOpenAlert(opts: {
  name: string;
  company: string;
  title: string;
  applyUrl?: string | null;
}) {
  const link =
    opts.applyUrl && isDirectApplyUrl(opts.applyUrl)
      ? ` Apply: ${opts.applyUrl}`
      : "";
  const title = /summer\s*2027/i.test(opts.title)
    ? opts.title
    : `${opts.title} (Summer 2027)`;
  return `RadarApply: ${opts.company} — ${title} just OPENED.${link} Go now.`;
}

export function firstNameFrom(fullName: string): string {
  const part = fullName.trim().split(/\s+/)[0];
  return part || "there";
}

export function formatWelcomeSms(fullName: string): string {
  const first = firstNameFrom(fullName);
  return [
    `Congrats ${first}, you're signed up for alerts from RadarApply 🚨`,
    `Save this number and be on the lookout for texts from us!`,
    `Get ready to bag that internship 💰`,
  ].join("\n");
}
