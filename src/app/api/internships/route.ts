import { NextResponse } from "next/server";
import { listInternships } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase";
import { INTERNSHIP_CATALOG } from "@/lib/internships";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      internships: INTERNSHIP_CATALOG.map((item, i) => ({
        id: `catalog-${i}`,
        company: item.company,
        title: item.title,
        slug: item.slug,
        description: item.description,
        status: "closed",
        applyUrl: item.applyUrl,
        sourceType: item.sourceType,
      })),
      warning: "Supabase not configured",
    });
  }

  try {
    const internships = await listInternships();
    return NextResponse.json({
      internships: internships.map((i) => ({
        id: i.id,
        company: i.company,
        title: i.title,
        slug: i.slug,
        description: i.description,
        status: i.status,
        applyUrl: i.applyUrl,
        sourceType: i.sourceType,
      })),
    });
  } catch (err) {
    console.error("[internships]", err);
    return NextResponse.json(
      { error: "Failed to load internships from Supabase." },
      { status: 500 },
    );
  }
}
