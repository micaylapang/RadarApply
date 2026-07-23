import {
  createAlert,
  getInternshipById,
  getPendingSubscriptions,
  listInternships,
  markSubscriptionAlerted,
  resetSubscriptionAlerts,
  updateInternshipStatus,
} from "@/lib/db";
import { detectMany } from "@/lib/detect";
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

export type PollStats = {
  roles: number;
  checked: number;
  skipped: number;
  fetchFailed: number;
  boardsFetched: number;
  opened: number;
  closed: number;
  elapsedMs: number;
};

/**
 * One watch tick: fetch each unique board once, then update every role that
 * shares it. Safe to call every minute from Vercel Cron / external ping.
 */
export async function pollOnce(): Promise<PollStats> {
  const started = Date.now();
  const internships = await listInternships();
  const now = new Date().toISOString();

  const detections = await detectMany(
    internships.map((i) => ({
      id: i.id,
      sourceType: i.sourceType,
      sourceKey: i.sourceKey,
      titleFilter: i.titleFilter,
      currentStatus: i.status,
      applyUrl: i.applyUrl,
    })),
  );

  const boardKeys = new Set<string>();
  let checked = 0;
  let skipped = 0;
  let fetchFailed = 0;
  let opened = 0;
  let closed = 0;

  await Promise.all(
    internships.map(async (internship) => {
      const result = detections.get(internship.id);
      if (!result) return;
      if (result.boardKey) boardKeys.add(result.boardKey);

      if (result.skipped) {
        skipped += 1;
        await updateInternshipStatus(internship.id, { lastChecked: now });
        return;
      }

      if (result.fetchFailed) {
        fetchFailed += 1;
        await updateInternshipStatus(internship.id, { lastChecked: now });
        return;
      }

      checked += 1;

      const wasClosed = internship.status === "closed";
      const isOpen = result.open;
      const isFirstCheck = !internship.lastChecked;

      if (wasClosed && isOpen) {
        const detectedAt = Date.now();
        const applyUrl = result.jobs[0]?.absoluteUrl ?? internship.applyUrl;

        // First sync: job was already live before we started watching — open it
        // without claiming a drop timestamp.
        if (isFirstCheck) {
          await updateInternshipStatus(internship.id, {
            status: "open",
            lastChecked: now,
            applyUrl: applyUrl ?? internship.applyUrl,
          });
          opened += 1;
          console.log(
            `[monitor] synced open (no alert): ${internship.company} — ${internship.title}`,
          );
          return;
        }

        await updateInternshipStatus(internship.id, {
          status: "open",
          openedAt: now,
          lastChecked: now,
          applyUrl: applyUrl ?? internship.applyUrl,
        });
        opened += 1;

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
        await resetSubscriptionAlerts(internship.id);
        closed += 1;
      } else {
        const liveApply = result.jobs[0]?.absoluteUrl;
        await updateInternshipStatus(internship.id, {
          lastChecked: now,
          ...(isOpen && liveApply ? { applyUrl: liveApply } : {}),
        });
      }
    }),
  );

  return {
    roles: internships.length,
    checked,
    skipped,
    fetchFailed,
    boardsFetched: boardKeys.size,
    opened,
    closed,
    elapsedMs: Date.now() - started,
  };
}
