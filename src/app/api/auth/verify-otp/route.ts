import { NextResponse } from "next/server";
import { z } from "zod";
import {
  bumpLoginCodeAttempts,
  consumeLoginCode,
  getLatestLoginCode,
  getUserByPhone,
  listUserTracking,
} from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import {
  SESSION_COOKIE,
  codesMatch,
  createSessionToken,
  hashLoginCode,
  sessionCookieOptions,
} from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase";

const bodySchema = z.object({
  phone: z.string().trim().min(7).max(30),
  code: z.string().trim().regex(/^\d{6}$/),
});

const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured yet." },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter your phone and the 6-digit code from your text." },
      { status: 400 },
    );
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return NextResponse.json(
      { error: "Enter a valid phone number." },
      { status: 400 },
    );
  }

  try {
    const user = await getUserByPhone(phone);
    if (!user) {
      return NextResponse.json(
        { error: "No account found for that number." },
        { status: 404 },
      );
    }

    const latest = await getLatestLoginCode(phone);
    if (!latest || latest.consumed_at) {
      return NextResponse.json(
        { error: "Request a new login code first." },
        { status: 400 },
      );
    }

    if (new Date(latest.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "That code expired. Request a new one." },
        { status: 400 },
      );
    }

    if (latest.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many attempts. Request a new code." },
        { status: 429 },
      );
    }

    const expected = hashLoginCode(phone, parsed.data.code);
    if (!codesMatch(expected, latest.code_hash)) {
      await bumpLoginCodeAttempts(latest.id, latest.attempts + 1);
      return NextResponse.json(
        { error: "Incorrect code. Try again." },
        { status: 401 },
      );
    }

    await consumeLoginCode(latest.id);
    const tracking = await listUserTracking(user.id);
    const token = createSessionToken(user.id);

    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, phone: user.phone },
      tracking,
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (err) {
    console.error("[auth/verify-otp]", err);
    return NextResponse.json(
      { error: "Could not verify that code. Try again." },
      { status: 500 },
    );
  }
}
