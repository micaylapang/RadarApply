import { NextResponse } from "next/server";
import { getUserById } from "@/lib/db";
import {
  SEASON_PASS_DESCRIPTION,
  SEASON_PASS_NAME,
  SEASON_PASS_PRICE_CENTS,
  SEASON_PASS_PRODUCT_KEY,
} from "@/lib/limits";
import { hasActiveSeasonPass } from "@/lib/season-pass";
import { getSessionUserId } from "@/lib/session";
import { appBaseUrl, getStripe, isStripeConfigured } from "@/lib/stripe";
import { isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured yet." },
      { status: 503 },
    );
  }
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured yet. Add STRIPE_SECRET_KEY." },
      { status: 503 },
    );
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Log in to buy the season pass.", loginRequired: true },
      { status: 401 },
    );
  }

  try {
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 401 });
    }

    if (hasActiveSeasonPass(user)) {
      return NextResponse.json(
        {
          error: "You already have an active season pass.",
          alreadyActive: true,
          expiresAt: user.season_pass_expires_at,
        },
        { status: 409 },
      );
    }

    const stripe = getStripe();
    const base = appBaseUrl(request);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        product: SEASON_PASS_PRODUCT_KEY,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: SEASON_PASS_PRICE_CENTS,
            product_data: {
              name: SEASON_PASS_NAME,
              description: SEASON_PASS_DESCRIPTION,
            },
          },
        },
      ],
      success_url: `${base}/upgrade?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/upgrade?canceled=1`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Could not start checkout." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("[billing/checkout]", err);
    return NextResponse.json(
      { error: "Could not start Stripe checkout." },
      { status: 500 },
    );
  }
}
