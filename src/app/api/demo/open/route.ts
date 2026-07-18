import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getInternshipBySlug,
  resetSubscriptionAlerts,
  updateInternshipStatus,
} from "@/lib/db";
import { notifySubscribers } from "@/lib/notify";
import { isSupabaseConfigured } from "@/lib/supabase";

const bodySchema = z.object({
  slug: z.string().default("droptext-demo"),
  secret: z.string().optional(),
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured yet." },
      { status: 503 },
    );
  }

  const expected = process.env.DEMO_TRIGGER_SECRET;
  let json: unknown = {};
  try {
    json = await request.json();
  } catch {
    json = {};
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (expected && parsed.data.secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const internship = await getInternshipBySlug(parsed.data.slug);

    if (!internship) {
      return NextResponse.json({ error: "Internship not found" }, { status: 404 });
    }

    if (internship.sourceType !== "manual") {
      return NextResponse.json(
        { error: "Only manual/demo internships can be triggered this way." },
        { status: 400 },
      );
    }

    const detectedAt = Date.now();
    const now = new Date().toISOString();

    await updateInternshipStatus(internship.id, {
      status: "open",
      openedAt: now,
      lastChecked: now,
    });

    await resetSubscriptionAlerts(internship.id);
    const result = await notifySubscribers(internship.id, detectedAt);

    return NextResponse.json({
      ok: true,
      internship: internship.slug,
      sent: result.sent,
      failed: result.failed,
      subscribers: result.subscribers,
      errors: result.errors,
      latencyHintMs: Date.now() - detectedAt,
    });
  } catch (err) {
    console.error("[demo/open]", err);
    return NextResponse.json(
      { error: "Demo trigger failed. Check Supabase setup." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured yet." },
      { status: 503 },
    );
  }

  const expected = process.env.DEMO_TRIGGER_SECRET;
  let json: unknown = {};
  try {
    json = await request.json();
  } catch {
    json = {};
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (expected && parsed.data.secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const internship = await getInternshipBySlug(parsed.data.slug);
    if (!internship) {
      return NextResponse.json({ error: "Internship not found" }, { status: 404 });
    }

    await updateInternshipStatus(internship.id, {
      status: "closed",
      openedAt: null,
    });
    await resetSubscriptionAlerts(internship.id);

    return NextResponse.json({ ok: true, status: "closed" });
  } catch (err) {
    console.error("[demo/open DELETE]", err);
    return NextResponse.json({ error: "Failed to reset demo." }, { status: 500 });
  }
}
