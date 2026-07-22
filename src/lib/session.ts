import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "radar_session";
const SESSION_DAYS = 30;

function authSecret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.CRON_SECRET ||
    "radar-apply-dev-auth-secret"
  );
}

function b64url(input: Buffer | string) {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(input: string) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64");
}

function sign(payload: string) {
  return createHmac("sha256", authSecret()).update(payload).digest();
}

export function createSessionToken(userId: string) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 24 * 60 * 60;
  const payload = b64url(JSON.stringify({ sub: userId, exp }));
  const sig = b64url(sign(payload));
  return `${payload}.${sig}`;
}

export function readSessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = sign(payload);
  const actual = fromB64url(sig);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  try {
    const data = JSON.parse(fromB64url(payload).toString("utf8")) as {
      sub?: string;
      exp?: number;
    };
    if (!data.sub || !data.exp || data.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return data.sub;
  } catch {
    return null;
  }
}

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  return readSessionToken(jar.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions(maxAgeSeconds = SESSION_DAYS * 24 * 60 * 60) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function generateLoginCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashLoginCode(phone: string, code: string) {
  return createHmac("sha256", authSecret())
    .update(`${phone}:${code}`)
    .digest("hex");
}

export function codesMatch(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
