import { NextResponse } from "next/server";
import { z } from "zod";
import { createLoginCode, getLatestLoginCode, getUserByPhone } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { generateLoginCode, hashLoginCode } from "@/lib/session";
import { friendlySmsError, sendSms } from "@/lib/sms";
import { isSupabaseConfigured } from "@/lib/supabase";

const bodySchema = z.object({
  phone: z.string().trim().min(7).max(30),
});

const COOLDOWN_MS = 60_000;
const CODE_TTL_MS = 10 * 60_000;

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
      { error: "Enter the phone number you used to sign up." },
      { status: 400 },
    );
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return NextResponse.json(
      { error: "Enter a valid phone number (US numbers work as 10 digits)." },
      { status: 400 },
    );
  }

  try {
    const user = await getUserByPhone(phone);
    if (!user) {
      return NextResponse.json(
        {
          error:
            "No account found for that number. Sign up first, then come back to log in.",
        },
        { status: 404 },
      );
    }

    const latest = await getLatestLoginCode(phone);
    if (latest) {
      const age = Date.now() - new Date(latest.created_at).getTime();
      if (age < COOLDOWN_MS) {
        const waitSec = Math.ceil((COOLDOWN_MS - age) / 1000);
        return NextResponse.json(
          { error: `Wait ${waitSec}s before requesting another code.` },
          { status: 429 },
        );
      }
    }

    const code = generateLoginCode();
    const codeHash = hashLoginCode(phone, code);
    await createLoginCode(phone, codeHash, new Date(Date.now() + CODE_TTL_MS));

    const body = `RadarApply login code: ${code}. Expires in 10 minutes. Reply STOP to cancel alerts.`;
    try {
      await sendSms(phone, body);
    } catch (err) {
      console.error("[auth/request-otp] sms", err);
      return NextResponse.json(
        { error: friendlySmsError(err) },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Code sent. Check your texts.",
    });
  } catch (err) {
    console.error("[auth/request-otp]", err);
    const msg = String(
      (err as { message?: string })?.message ?? err ?? "",
    ).toLowerCase();
    if (msg.includes("login_codes") || msg.includes("schema cache")) {
      return NextResponse.json(
        {
          error:
            "Login isn’t set up in the database yet (missing login_codes table). Run the login_codes SQL from supabase/schema.sql in the Supabase SQL Editor, then try again.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Could not send a login code. Try again." },
      { status: 500 },
    );
  }
}
