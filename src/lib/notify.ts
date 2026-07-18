import {
  createAlert,
  getInternshipById,
  getPendingSubscriptions,
  listInternships,
  markSubscriptionAlerted,
  updateInternshipStatus,
} from "@/lib/db";
import { detectInternshipOpen } from "@/lib/detect";
import { formatOpenAlert, friendlySmsError, sendSms } from "@/lib/sms";

/**
 * Fire SMS to every subscriber the instant an internship flips closed → open.
 */
export async function notifySubscribers(internshipId: string, detectedAt: number) {
  const internship = await getInternshipById(internshipId);
  if (!internship) return { sent: 0, failed: 0, errors: [] as string[], subscribers: 0 };

  const subscriptions = await getPendingSubscriptions(internshipId);

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      const body = formatOpenAlert({
        name: sub.user.name,
        company: internship.company,
        title: internship.title,
        applyUrl: internship.applyUrl,
      });

      try {
        await sendSms(sub.user.phone, body);
        const latencyMs = Date.now() - detectedAt;

        await markSubscriptionAlerted(sub.id);
        await createAlert({
          userId: sub.userId,
          internshipId,
          phone: sub.user.phone,
          body,
          status: "sent",
          latencyMs,
        });

        sent += 1;
        console.log(
          `[alert] ${internship.company} → ${sub.user.phone} in ${latencyMs}ms`,
        );
      } catch (err) {
        failed += 1;
        const friendly = friendlySmsError(err);
        errors.push(`${sub.user.phone}: ${friendly}`);
        console.error(`[alert] failed for ${sub.user.phone}`, err);
        await createAlert({
          userId: sub.userId,
          internshipId,
          phone: sub.user.phone,
          body,
          status: "failed",
          latencyMs: Date.now() - detectedAt,
        });
      }
    }),
  );

  return { sent, failed, errors, subscribers: subscriptions.length };
}

export async function pollOnce() {
  const internships = await listInternships();
  const now = new Date().toISOString();

  await Promise.all(
    internships.map(async (internship) => {
      const result = await detectInternshipOpen({
        sourceType: internship.sourceType,
        sourceKey: internship.sourceKey,
        titleFilter: internship.titleFilter,
        currentStatus: internship.status,
      });

      if (result.skipped) {
        await updateInternshipStatus(internship.id, { lastChecked: now });
        return;
      }

      const wasClosed = internship.status === "closed";
      const isOpen = result.open;
      const isFirstCheck = !internship.lastChecked;

      if (wasClosed && isOpen) {
        const detectedAt = Date.now();
        const applyUrl = result.jobs[0]?.absoluteUrl ?? internship.applyUrl;

        await updateInternshipStatus(internship.id, {
          status: "open",
          openedAt: now,
          lastChecked: now,
          applyUrl: applyUrl ?? internship.applyUrl,
        });

        // First sync only — don't SMS for jobs that were already open before RadarApply started
        if (isFirstCheck) {
          console.log(
            `[monitor] synced open (no alert): ${internship.company} — ${internship.title}`,
          );
          return;
        }

        console.log(
          `[monitor] OPEN detected: ${internship.company} — ${internship.title}`,
        );
        await notifySubscribers(internship.id, detectedAt);
      } else if (!wasClosed && !isOpen) {
        await updateInternshipStatus(internship.id, {
          status: "closed",
          openedAt: null,
          lastChecked: now,
        });
      } else {
        await updateInternshipStatus(internship.id, { lastChecked: now });
      }
    }),
  );
}
