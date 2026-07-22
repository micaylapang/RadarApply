import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserById, grantSeasonPass } from "@/lib/db";
import { SEASON_PASS_PRODUCT_KEY } from "@/lib/limits";
import { hasActiveSeasonPass, seasonPassExpiresAt } from "@/lib/season-pass";
import { getSessionUserId } from "@/lib/session";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

const bodySchema = z.object({
  sessionId: z.string().trim().min(1),
});

/** Confirm checkout after redirect (covers webhook delay). */
export async function POST(request: Request) {
  if (!isSupabaseConfigured() || !isStripeConfigured()) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing session id." }, { status: 400 });
  }

  try {
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 401 });
    }

    if (hasActiveSeasonPass(user)) {
      return NextResponse.json({
        ok: true,
        alreadyActive: true,
        expiresAt: user.season_pass_expires_at,
      });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(parsed.data.sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed yet." },
        { status: 402 },
      );
    }

    const sessionUserId =
      session.metadata?.userId || session.client_reference_id;
    if (sessionUserId !== userId) {
      return NextResponse.json({ error: "Session mismatch." }, { status: 403 });
    }

    const product = session.metadata?.product;
    if (product && product !== SEASON_PASS_PRODUCT_KEY) {
      return NextResponse.json({ error: "Unknown product." }, { status: 400 });
    }

    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id ?? null;

    const updated = await grantSeasonPass({
      userId,
      expiresAt: seasonPassExpiresAt(),
      stripeCustomerId: customerId,
      stripeCheckoutSessionId: session.id,
    });

    return NextResponse.json({
      ok: true,
      expiresAt: updated.season_pass_expires_at,
    });
  } catch (err) {
    console.error("[billing/confirm]", err);
    return NextResponse.json(
      { error: "Could not confirm payment." },
      { status: 500 },
    );
  }
}
