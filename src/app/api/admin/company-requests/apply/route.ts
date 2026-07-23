import { NextResponse } from "next/server";
import { z } from "zod";
import { adminSecret, isAdminAuthorized } from "@/lib/admin-auth";
import { applyCompanyRequestCatalog } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  company: z.string().trim().min(1).max(120),
  rolesText: z.string().max(500).optional().nullable(),
  careersUrl: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => {
      const t = v?.trim();
      return t ? t : null;
    })
    .refine((v) => !v || /^https?:\/\//i.test(v), {
      message: "Careers URL must start with http(s)",
    }),
});

/**
 * Approve/add a company+roles to the live catalog without a company_requests row.
 * Used when the review queue is held in the browser (DB table not created yet).
 */
export async function POST(request: Request) {
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

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  try {
    const result = await applyCompanyRequestCatalog({
      company: parsed.data.company,
      rolesText: parsed.data.rolesText,
      careersUrl: parsed.data.careersUrl,
    });
    return NextResponse.json({
      ok: true,
      added: result.added,
      skipped: result.skipped,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not add company.";
    console.error("[admin/company-requests/apply]", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
