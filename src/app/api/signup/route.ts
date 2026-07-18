import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getInternshipsByIds,
  listUserTracking,
  upsertSubscriptions,
  upsertUser,
} from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { notifySubscribers } from "@/lib/notify";
import { isSupabaseConfigured } from "@/lib/supabase";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(7).max(30),
  internshipIds: z.array(z.string().min(1)).min(1),
});

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
      { error: "Check your name, phone, and selected internships." },
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
    const internships = await getInternshipsByIds(parsed.data.internshipIds);

    if (internships.length !== parsed.data.internshipIds.length) {
      return NextResponse.json(
        { error: "One or more selected internships are invalid." },
        { status: 400 },
      );
    }

    const user = await upsertUser(parsed.data.name, phone);
    await upsertSubscriptions(user.id, parsed.data.internshipIds);
    const tracking = await listUserTracking(user.id);

    const alreadyOpen = internships.filter((i) => i.status === "open");
    await Promise.all(
      alreadyOpen.map((i) => notifySubscribers(i.id, Date.now())),
    );

    return NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, phone: user.phone },
      tracking,
    });
  } catch (err) {
    console.error("[signup]", err);
    return NextResponse.json(
      { error: "Could not save your signup. Check Supabase setup." },
      { status: 500 },
    );
  }
}
