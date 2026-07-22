/**
 * True when the URL points at a specific job posting, not a careers index
 * or keyword search page.
 */
export function isDirectApplyUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const path = u.pathname;

    if (u.searchParams.has("gh_jid")) return true;
    if (/\/jobs\/\d+\/?$/i.test(path)) return true;
    if (/\/careers\/job\/\d+/i.test(path)) return true;
    if (/\/job\/\d+/i.test(path)) return true;

    // Amazon job detail
    if (host.includes("amazon.jobs") && /\/jobs\/\d+/i.test(path)) return true;

    // Citadel role detail pages
    if (host.includes("citadel.com") && /\/careers\/details\//i.test(path)) {
      return true;
    }

    // Optiver join-us job detail pages
    if (host.includes("optiver.com") && /\/join-us\/jobs\//i.test(path)) {
      return true;
    }

    // Two Sigma (Avature) JobDetail pages
    if (host.includes("twosigma.com") && /\/JobDetail\//i.test(path)) {
      return true;
    }

    // D.E. Shaw role detail pages
    if (host.includes("deshaw.com") && /\/careers\/[^/]+-\d+\/?$/i.test(path)) {
      return true;
    }

    // Hudson River Trading role detail pages
    if (host.includes("hudsonrivertrading.com") && /\/hrt-job\//i.test(path)) {
      return true;
    }

    // Jane Street role detail pages
    if (
      host.includes("janestreet.com") &&
      /\/join-jane-street\/position\/\d+\/?$/i.test(path)
    ) {
      return true;
    }

    // Apple jobs detail / apply pages (id may include locale suffix, e.g. 200664780-3810)
    if (
      host.includes("jobs.apple.com") &&
      /\/details\/\d+(-\d+)?(\/|$)/i.test(path)
    ) {
      return true;
    }

    // Ashby hosted postings: /jobs/{id} or /{board}/{uuid}
    if (host.includes("ashbyhq.com")) {
      if (/\/jobs?\//i.test(path)) return true;
      if (/\/[a-f0-9-]{8,}\/?$/i.test(path)) return true;
    }

    // Lever postings end with a UUID-ish segment
    if (host.includes("lever.co") && /\/[a-f0-9-]{8,}\/?$/i.test(path)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
