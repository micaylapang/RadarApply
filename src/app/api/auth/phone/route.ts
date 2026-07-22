import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserByPhone, updateUserPhone } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { getSessionUserId } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase";

const bodySchema = z.object({
  phone: z.string().trim().min(7).max(30),
});

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured yet." },
      { status: 503 },
    );
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
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
      { error: "Enter a valid phone number." },
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
    const taken = await getUserByPhone(phone);
    if (taken && taken.id !== userId) {
      return NextResponse.json(
        { error: "That number is already linked to another account." },
        { status: 409 },
      );
    }

    const user = await updateUserPhone(userId, phone);
    return NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, phone: user.phone },
    });
  } catch (err) {
    console.error("[auth/phone]", err);
    return NextResponse.json(
      { error: "Could not update your number. Try again." },
      { status: 500 },
    );
  }
}
