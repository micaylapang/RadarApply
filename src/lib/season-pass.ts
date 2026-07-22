import {
  FREE_COMPANY_LIMIT,
  MONETIZATION_ENABLED,
  SEASON_PASS_EXPIRES_AT,
  UPGRADE_PATH,
} from "@/lib/limits";

export type SeasonPassUser = {
  season_pass_expires_at?: string | null;
};

export function hasActiveSeasonPass(
  user: SeasonPassUser | null | undefined,
): boolean {
  // While monetization is paused, treat everyone as unlocked.
  if (!MONETIZATION_ENABLED) return true;
  const expires = user?.season_pass_expires_at;
  if (!expires) return false;
  const at = Date.parse(expires);
  return Number.isFinite(at) && at > Date.now();
}

export function seasonPassExpiresAt(): Date {
  return new Date(SEASON_PASS_EXPIRES_AT);
}

export function formatSeasonPassExpiry(iso = SEASON_PASS_EXPIRES_AT): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Unique company count from rows that include a company field. */
export function uniqueCompanyCount(
  rows: Array<{ company: string }>,
): number {
  return new Set(rows.map((r) => r.company.trim()).filter(Boolean)).size;
}

/**
 * Whether adding these companies would exceed the free cap without a pass.
 * Grandfathered lists above the free limit can keep existing companies.
 * Always false while monetization is paused.
 */
export function wouldExceedFreeCompanyLimit(opts: {
  existingCompanies: Iterable<string>;
  nextCompanies: Iterable<string>;
  hasPass: boolean;
}): boolean {
  if (!MONETIZATION_ENABLED) return false;
  if (opts.hasPass) return false;

  const existing = new Set(
    [...opts.existingCompanies].map((c) => c.trim()).filter(Boolean),
  );
  const next = new Set(
    [...opts.nextCompanies].map((c) => c.trim()).filter(Boolean),
  );

  if (next.size <= FREE_COMPANY_LIMIT) return false;
  return next.size > existing.size;
}

export function upgradeUrl(reason?: string): string {
  if (!reason) return UPGRADE_PATH;
  const params = new URLSearchParams({ reason });
  return `${UPGRADE_PATH}?${params.toString()}`;
}
