import { NextResponse } from "next/server";
import { adminSecret, isAdminAuthorized } from "@/lib/admin-auth";
import { listCompanyRequests } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured yet." },
      { status: 503 },
    );
  }

  if (!adminSecret()) {
    return NextResponse.json(
      { error: "Set ADMIN_SECRET (or CRON_SECRET) to unlock admin." },
      { status: 503 },
    );
  }

  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status") ?? "pending";
    const status =
      statusParam === "all" ||
      statusParam === "approved" ||
      statusParam === "rejected" ||
      statusParam === "pending"
        ? statusParam
        : "pending";

    const requests = await listCompanyRequests({ status });
    return NextResponse.json({ requests });
  } catch (err) {
    console.error("[admin/company-requests]", err);
    return NextResponse.json(
      { error: "Could not load company requests." },
      { status: 500 },
    );
  }
}
