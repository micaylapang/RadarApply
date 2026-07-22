import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getUserById, grantSeasonPass } from "@/lib/db";
import { SEASON_PASS_PRODUCT_KEY } from "@/lib/limits";
import { seasonPassExpiresAt } from "@/lib/season-pass";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSupabaseConfigured() || !isStripeConfigured()) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[billing/webhook] signature", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await activateSeasonPassFromSession(session);
    }
  } catch (err) {
    console.error("[billing/webhook]", err);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function activateSeasonPassFromSession(
  session: Stripe.Checkout.Session,
) {
  if (session.payment_status && session.payment_status !== "paid") {
    return;
  }

  const product = session.metadata?.product;
  if (product && product !== SEASON_PASS_PRODUCT_KEY) {
    return;
  }

  const userId =
    session.metadata?.userId ||
    session.client_reference_id ||
    null;
  if (!userId) {
    console.error("[billing/webhook] missing userId on session", session.id);
    return;
  }

  const user = await getUserById(userId);
  if (!user) {
    console.error("[billing/webhook] user not found", userId);
    return;
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  await grantSeasonPass({
    userId,
    expiresAt: seasonPassExpiresAt(),
    stripeCustomerId: customerId,
    stripeCheckoutSessionId: session.id,
  });
}
