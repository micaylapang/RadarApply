export type DropStatus = "waiting" | "soon" | "open";

export const DROP_STATUS_LABEL: Record<DropStatus, string> = {
  waiting: "waiting ⏳",
  soon: "opening soon 🔥",
  open: "already open! ✅",
};

/**
 * Curated fallback when we have no live board signal yet.
 * Live open roles from the monitor override this to "open".
 */
export const COMPANY_DROP_STATUS: Record<string, DropStatus> = {
  Meta: "waiting",
  Amazon: "waiting",
  Apple: "open",
  Netflix: "waiting",
  Google: "open",
  Microsoft: "waiting",
  NVIDIA: "waiting",
  Databricks: "waiting",
  Palantir: "open",
  Uber: "waiting",
  Airbnb: "waiting",
  Adobe: "waiting",
  Salesforce: "waiting",
  Oracle: "waiting",
  LinkedIn: "waiting",
  Roblox: "waiting",
  Snap: "waiting",
  Spotify: "waiting",
  TikTok: "waiting",
  X: "waiting",
  Stripe: "waiting",
  Coinbase: "soon",
  Notion: "waiting",
  Figma: "soon",
  Discord: "waiting",
  Ramp: "waiting",
  Datadog: "waiting",
  "Jane Street": "waiting",
  Citadel: "open",
  "Two Sigma": "open",
  "Hudson River Trading": "open",
  "Jump Trading": "open",
  "D.E. Shaw": "open",
  "Akuna Capital": "open",
  IMC: "open",
  Optiver: "open",
  SpaceX: "waiting",
  Tesla: "waiting",
  Neuralink: "waiting",
  "Lockheed Martin": "waiting",
  Boeing: "waiting",
  "Northrop Grumman": "waiting",
  Raytheon: "waiting",
  "Texas Instruments": "waiting",
  Qualcomm: "waiting",
  ExxonMobil: "waiting",
  Pfizer: "waiting",
  Kalshi: "open",
  "Scale AI": "open",
  "Capital One": "waiting",
};

/**
 * Human-verified open dates (YYYY-MM-DD). Preferred over monitor first-seen
 * time when both exist. Only add when confirmed from a reliable source.
 */
export const VERIFIED_OPENED_AT: Record<string, string> = {
  "Akuna Capital": "2026-07-13",
  Google: "2026-07-21",
};

export type LiveRoleStatus = {
  status?: string | null;
  openedAt?: string | null;
};

export function companyDropStatus(
  company: string,
  liveRoles: LiveRoleStatus[] = [],
): DropStatus {
  if (liveRoles.some((r) => r.status === "open")) return "open";
  return COMPANY_DROP_STATUS[company] ?? "waiting";
}

/** Live open or curated-open company — belongs on Apply Now, not SMS tracking. */
export function isRoleOpenForApply(
  company: string,
  role: { status?: string | null },
): boolean {
  if (role.status === "open") return true;
  return COMPANY_DROP_STATUS[company] === "open";
}

export function isRoleTrackable(
  company: string,
  role: { status?: string | null },
): boolean {
  return !isRoleOpenForApply(company, role);
}

export function companyHasTrackableRoles(
  company: string,
  roles: Array<{ status?: string | null }>,
): boolean {
  return roles.some((role) => isRoleTrackable(company, role));
}

export function formatOpenSinceDate(iso: string): string {
  const raw = iso.includes("T") ? iso : `${iso}T12:00:00`;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysUntil(date: Date, from: Date = new Date()): number {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function companyDropLabel(
  company: string,
  liveRoles: LiveRoleStatus[] = [],
): string {
  return DROP_STATUS_LABEL[companyDropStatus(company, liveRoles)];
}

/** Earliest open timestamp for a company: verified date wins, else earliest role opened_at. */
export function companyOpenSince(
  company: string,
  openedAts: Array<string | null | undefined> = [],
): string | null {
  const verified = VERIFIED_OPENED_AT[company];
  if (verified) return verified;

  const fromLive = openedAts
    .filter((v): v is string => Boolean(v))
    .sort();
  return fromLive[0] ?? null;
}

/**
 * "opened Jul 13, 6 days since open"
 * Uses verified company date, or a role's monitor opened_at when we watched it flip.
 */
export function openSinceLabel(
  since: string | null | undefined,
  from: Date = new Date(),
): string | null {
  if (!since) return null;

  const openDate = new Date(since.includes("T") ? since : `${since}T12:00:00`);
  if (Number.isNaN(openDate.getTime())) return null;

  const daysOpen = Math.max(0, -daysUntil(openDate, from));
  const dayWord = daysOpen === 1 ? "day" : "days";
  return `opened ${formatOpenSinceDate(since)}, ${daysOpen} ${dayWord} since open`;
}

export function roleOpenSinceLabel(
  company: string,
  openedAt: string | null | undefined,
  from: Date = new Date(),
): string | null {
  return openSinceLabel(companyOpenSince(company, [openedAt ?? null]), from);
}

export function companyOpenSinceLabel(
  company: string,
  liveRoles: LiveRoleStatus[] = [],
  from: Date = new Date(),
): string | null {
  if (companyDropStatus(company, liveRoles) !== "open") return null;

  const openedAts = liveRoles
    .filter((r) => r.status === "open")
    .map((r) => r.openedAt);

  return openSinceLabel(companyOpenSince(company, openedAts), from);
}
