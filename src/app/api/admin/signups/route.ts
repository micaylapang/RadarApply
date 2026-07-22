import { NextResponse } from "next/server";
import { listSignupReport } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function adminSecret() {
  return (
    process.env.ADMIN_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    ""
  );
}

function authorized(request: Request) {
  const expected = adminSecret();
  if (!expected) return false;

  const header = request.headers.get("authorization");
  if (header === `Bearer ${expected}`) return true;

  const url = new URL(request.url);
  if (url.searchParams.get("key") === expected) return true;

  return false;
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured yet." },
      { status: 503 },
    );
  }

  if (!adminSecret()) {
    return NextResponse.json(
      { error: "Set ADMIN_SECRET (or CRON_SECRET) to unlock the signup report." },
      { status: 503 },
    );
  }

  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const report = await listSignupReport();
    return NextResponse.json(report);
  } catch (err) {
    console.error("[admin/signups]", err);
    return NextResponse.json(
      { error: "Could not load signup report." },
      { status: 500 },
    );
  }
}
