import { NextResponse } from "next/server";
import { z } from "zod";
import { insertCompanyRequest } from "@/lib/db";
import { sendCompanyRequestEmail } from "@/lib/email";
import { isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

const bodySchema = z.object({
  company: z.string().trim().min(1).max(120),
  roles: z.string().trim().max(500).optional(),
  contact: z.string().trim().max(120).optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a company name (roles are optional)." },
      { status: 400 },
    );
  }

  const payload = {
    company: parsed.data.company,
    roles: parsed.data.roles,
    contact: parsed.data.contact,
  };

  let saved = false;
  if (isSupabaseConfigured()) {
    try {
      const row = await insertCompanyRequest(payload);
      saved = Boolean(row?.id);
    } catch (err) {
      console.error("[company-request] db", err);
    }
  }

  let emailed = false;
  let emailError: string | null = null;
  try {
    await sendCompanyRequestEmail(payload);
    emailed = true;
  } catch (err) {
    emailError = err instanceof Error ? err.message : String(err);
    console.error("[company-request] email", emailError);
  }

  if (saved || emailed) {
    return NextResponse.json({ ok: true, saved, emailed });
  }

  return NextResponse.json(
    {
      error: "Could not send your request. Try again in a moment.",
      detail: emailError,
    },
    { status: 502 },
  );
}
