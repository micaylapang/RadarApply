import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getInternshipsByIds,
  getUserByPhone,
  listUserTracking,
  upsertSubscriptions,
  upsertUser,
} from "@/lib/db";
import { emailConfigured, sendNewSignupEmail } from "@/lib/email";
import { appendSignupToGoogleSheet } from "@/lib/google-sheets";
import { FREE_COMPANY_LIMIT, MONETIZATION_ENABLED, UPGRADE_PATH } from "@/lib/limits";
import { notifySubscribers } from "@/lib/notify";
import { normalizePhone } from "@/lib/phone";
import {
  hasActiveSeasonPass,
  wouldExceedFreeCompanyLimit,
} from "@/lib/season-pass";
import {
  SESSION_COOKIE,
  createSessionToken,
  getSessionUserId,
  sessionCookieOptions,
} from "@/lib/session";
import { formatWelcomeSms, sendSms } from "@/lib/sms";
import { isSupabaseConfigured } from "@/lib/supabase";
import { dedupeByCompanyRole } from "@/lib/role-meta";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(7).max(30),
  internshipIds: z.array(z.string().min(1)).min(1),
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured yet." },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check your name, phone, and selected internships." },
      { status: 400 },
    );
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return NextResponse.json(
      { error: "Enter a valid phone number (US numbers work as 10 digits)." },
      { status: 400 },
    );
  }

  try {
    const internships = await getInternshipsByIds(parsed.data.internshipIds);

    if (internships.length !== parsed.data.internshipIds.length) {
      return NextResponse.json(
        { error: "One or more selected internships are invalid." },
        { status: 400 },
      );
    }

    const existing = await getUserByPhone(phone);
    const sessionUserId = await getSessionUserId();

    // Fresh signup with a number that already has an account → send them to log in.
    // Logged-in "Add more" (session matches) is still allowed.
    if (existing && sessionUserId !== existing.id) {
      return NextResponse.json(
        {
          error:
            "An account already exists for this number. Please log in.",
          loginRequired: true,
        },
        { status: 409 },
      );
    }

    const existingTracking = existing
      ? await listUserTracking(existing.id)
      : [];
    const existingCompanies = existingTracking.map((t) => t.company);
    const nextCompanies = [
      ...existingCompanies,
      ...internships.map((i) => i.company),
    ];

    if (
      MONETIZATION_ENABLED &&
      wouldExceedFreeCompanyLimit({
        existingCompanies,
        nextCompanies,
        hasPass: hasActiveSeasonPass(existing),
      })
    ) {
      return NextResponse.json(
        {
          error: `Free plan includes ${FREE_COMPANY_LIMIT} companies. Unlock unlimited tracking with the $10 season pass.`,
          upgradeRequired: true,
          upgradePath: UPGRADE_PATH,
          freeCompanyLimit: FREE_COMPANY_LIMIT,
        },
        { status: 402 },
      );
    }

    const isNewUser = !existing;
    const user = await upsertUser(parsed.data.name, phone);
    await upsertSubscriptions(user.id, parsed.data.internshipIds);
    const tracking = await listUserTracking(user.id);

    if (isNewUser) {
      try {
        await sendSms(phone, formatWelcomeSms(user.name));
      } catch (err) {
        console.error("[signup] welcome sms", err);
      }
    }

    let signupEmailSent = false;

    try {
      const alerts = dedupeByCompanyRole(
        internships.map((i) => ({
          company: i.company,
          title: i.title,
        })),
      );
      // Email only for brand-new accounts — not when someone adds more roles.
      // Server sends via Resend when configured; otherwise the browser sends once.
      if (isNewUser && emailConfigured()) {
        try {
          await sendNewSignupEmail({
            name: user.name,
            phone: user.phone,
            alerts,
            isNewUser: true,
          });
          signupEmailSent = true;
        } catch (err) {
          console.error("[signup] notify email", err);
        }
      }
      try {
        await appendSignupToGoogleSheet({
          name: user.name,
          phone: user.phone,
          isNewUser,
          alerts,
        });
      } catch (err) {
        console.error("[signup] google sheets", err);
      }
    } catch (err) {
      console.error("[signup] ops notify", err);
    }

    const alreadyOpen = internships.filter((i) => i.status === "open");
    await Promise.all(
      alreadyOpen.map((i) => notifySubscribers(i.id, Date.now())),
    );

    const response = NextResponse.json({
      ok: true,
      isNewUser,
      emailSent: signupEmailSent,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        hasSeasonPass: hasActiveSeasonPass(user),
        seasonPassExpiresAt: user.season_pass_expires_at,
      },
      tracking,
      freeCompanyLimit: FREE_COMPANY_LIMIT,
    });
    response.cookies.set(
      SESSION_COOKIE,
      createSessionToken(user.id),
      sessionCookieOptions(),
    );
    return response;
  } catch (err) {
    console.error("[signup]", err);
    const detail =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : err instanceof Error
          ? err.message
          : null;
    return NextResponse.json(
      {
        error: "Could not save your signup. Check Supabase setup.",
        ...(process.env.NODE_ENV !== "production" && detail
          ? { detail }
          : detail
            ? { detail }
            : {}),
      },
      { status: 500 },
    );
  }
}
