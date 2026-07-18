import { NextResponse } from "next/server";
import { pollOnce } from "@/lib/notify";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron hits this every minute.
 * Protect with CRON_SECRET (Vercel sends Authorization: Bearer <CRON_SECRET>).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const started = Date.now();
  try {
    await pollOnce();
    return NextResponse.json({
      ok: true,
      elapsedMs: Date.now() - started,
    });
  } catch (err) {
    console.error("[cron/poll]", err);
    return NextResponse.json(
      { error: "Poll failed", elapsedMs: Date.now() - started },
      { status: 500 },
    );
  }
}
