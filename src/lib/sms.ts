import twilio from "twilio";

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
    return "That phone isn’t verified in Twilio yet. Open Twilio Console → Phone Numbers → Verified Caller IDs and verify it.";
  }
  if (isTrialTemplateError(err)) {
    return "Twilio trial blocked the message. Retry — RadarApply will use a trial template.";
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
  const link = opts.applyUrl ? ` Apply: ${opts.applyUrl}` : "";
  return `RadarApply: ${opts.company} — ${opts.title} just OPENED.${link} Go now.`;
}
