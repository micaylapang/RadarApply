import { NextResponse } from "next/server";
import { getUserById, listUserTracking } from "@/lib/db";
import { FREE_COMPANY_LIMIT, MONETIZATION_ENABLED } from "@/lib/limits";
import { hasActiveSeasonPass, uniqueCompanyCount } from "@/lib/season-pass";
import { getSessionUserId } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured yet." },
      { status: 503 },
    );
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    const tracking = await listUserTracking(user.id);
    const hasSeasonPass = hasActiveSeasonPass(user);
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        hasSeasonPass,
        seasonPassExpiresAt: user.season_pass_expires_at,
      },
      tracking,
      plan: {
        hasSeasonPass,
        seasonPassExpiresAt: user.season_pass_expires_at,
        freeCompanyLimit: FREE_COMPANY_LIMIT,
        companyCount: uniqueCompanyCount(tracking),
        monetizationEnabled: MONETIZATION_ENABLED,
      },
    });
  } catch (err) {
    console.error("[auth/me]", err);
    return NextResponse.json(
      { error: "Could not load your account." },
      { status: 500 },
    );
  }
}
