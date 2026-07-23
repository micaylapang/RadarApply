import { NextResponse } from "next/server";
import { z } from "zod";
import { adminSecret, isAdminAuthorized } from "@/lib/admin-auth";
import { approveCompanyRequest, rejectCompanyRequest } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  action: z.enum(["approve", "reject"]),
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
  rolesText: z.string().max(500).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
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

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing request id." }, { status: 400 });
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
    if (parsed.data.action === "reject") {
      const requestRow = await rejectCompanyRequest(id, parsed.data.note);
      if (!requestRow) {
        return NextResponse.json({ error: "Request not found." }, { status: 404 });
      }
      return NextResponse.json({ ok: true, request: requestRow });
    }

    const result = await approveCompanyRequest(id, {
      careersUrl: parsed.data.careersUrl,
      rolesText: parsed.data.rolesText,
    });
    return NextResponse.json({
      ok: true,
      request: result.request,
      added: result.added,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Review failed.";
    console.error("[admin/company-requests/review]", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
