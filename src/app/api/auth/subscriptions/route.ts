import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteUserSubscription, listUserTracking } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase";

const bodySchema = z.object({
  internshipId: z.string().min(1),
});

export async function DELETE(request: Request) {
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
      { error: "Pick a watch to remove." },
      { status: 400 },
    );
  }

  try {
    await deleteUserSubscription(userId, parsed.data.internshipId);
    const tracking = await listUserTracking(userId);
    return NextResponse.json({ ok: true, tracking });
  } catch (err) {
    console.error("[auth/subscriptions]", err);
    return NextResponse.json(
      { error: "Could not remove that watch." },
      { status: 500 },
    );
  }
}
