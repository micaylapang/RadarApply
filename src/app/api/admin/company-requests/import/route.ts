import { NextResponse } from "next/server";
import { z } from "zod";
import { adminSecret, isAdminAuthorized } from "@/lib/admin-auth";
import { importCompanyRequests } from "@/lib/db";
import {
  fetchFormSubmitSubmissions,
  parsePastedCompanyRequests,
} from "@/lib/company-request-import";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const bodySchema = z.discriminatedUnion("source", [
  z.object({
    source: z.literal("formsubmit"),
    apiKey: z.string().min(8).max(200).optional().nullable(),
  }),
  z.object({
    source: z.literal("paste"),
    text: z.string().min(8).max(100_000),
  }),
  z.object({
    source: z.literal("items"),
    items: z
      .array(
        z.object({
          company: z.string().min(1).max(120),
          roles: z.string().max(500).nullable().optional(),
          contact: z.string().max(120).nullable().optional(),
          createdAt: z.string().max(80).nullable().optional(),
        }),
      )
      .min(1)
      .max(500),
  }),
]);

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
    let items: Array<{
      company: string;
      roles?: string | null;
      contact?: string | null;
      createdAt?: string | null;
    }> = [];

    if (parsed.data.source === "formsubmit") {
      items = await fetchFormSubmitSubmissions(
        parsed.data.apiKey?.trim() ||
          process.env.FORMSUBMIT_API_KEY?.trim() ||
          "",
      );
    } else if (parsed.data.source === "paste") {
      items = parsePastedCompanyRequests(parsed.data.text);
    } else {
      items = parsed.data.items.map((i) => ({
        company: i.company,
        roles: i.roles ?? null,
        contact: i.contact ?? null,
        createdAt: i.createdAt ?? null,
      }));
    }

    if (parsed.data.source === "formsubmit" && !items.length) {
      const key =
        parsed.data.apiKey?.trim() || process.env.FORMSUBMIT_API_KEY?.trim();
      if (!key) {
        return NextResponse.json(
          {
            error:
              "Paste your FormSubmit API key (emailed to radarapply@gmail.com).",
          },
          { status: 400 },
        );
      }
    }

    const result = await importCompanyRequests(items);

    if (result.tableMissing || (result.imported === 0 && result.failed > 0)) {
      return NextResponse.json({
        ok: false,
        tableMissing: true,
        found: items.length,
        ...result,
        error:
          result.error ||
          "company_requests table is missing. Requests were not saved to the database.",
        preview: items.slice(0, 100).map((i) => ({
          company: i.company,
          roles: i.roles,
          contact: i.contact,
          createdAt: i.createdAt ?? null,
        })),
      });
    }

    return NextResponse.json({
      ok: true,
      found: items.length,
      ...result,
      preview: items.slice(0, 20).map((i) => ({
        company: i.company,
        roles: i.roles,
        contact: i.contact,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed.";
    console.error("[admin/company-requests/import]", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
