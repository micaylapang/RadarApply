/**
 * Brand marks for company list UI.
 * Every catalog company MUST have a resolvable logo (`src` under /public/logos).
 * See `.cursor/rules/company-logos.mdc`.
 *
 * Request-approved companies get a remote logo URL (logo.dev / Simple Icons /
 * Google favicon) resolved on approve and stored on the internship row.
 */
export const COMPANY_LOGOS: Record<
  string,
  { label: string; src: string }
> = {
  Meta: { label: "Meta", src: "/logos/meta.svg" },
  Amazon: { label: "Amazon", src: "/logos/amazon.svg" },
  Apple: { label: "Apple", src: "/logos/apple.svg" },
  Netflix: { label: "Netflix", src: "/logos/netflix.svg" },
  Google: { label: "Google", src: "/logos/google.svg" },
  Microsoft: { label: "Microsoft", src: "/logos/microsoft.svg" },
  NVIDIA: { label: "NVIDIA", src: "/logos/nvidia.svg" },
  Databricks: { label: "Databricks", src: "/logos/databricks.svg" },
  Palantir: { label: "Palantir", src: "/logos/palantir.svg" },
  Uber: { label: "Uber", src: "/logos/uber.svg" },
  Airbnb: { label: "Airbnb", src: "/logos/airbnb.svg" },
  Adobe: { label: "Adobe", src: "/logos/adobe.svg" },
  Salesforce: { label: "Salesforce", src: "/logos/salesforce.svg" },
  Oracle: { label: "Oracle", src: "/logos/oracle.svg" },
  LinkedIn: { label: "LinkedIn", src: "/logos/linkedin.svg" },
  Roblox: { label: "Roblox", src: "/logos/roblox.svg" },
  Snap: { label: "Snap", src: "/logos/snapchat.svg" },
  Spotify: { label: "Spotify", src: "/logos/spotify.svg" },
  TikTok: { label: "TikTok", src: "/logos/tiktok.svg" },
  X: { label: "X", src: "/logos/x.svg" },
  Stripe: { label: "Stripe", src: "/logos/stripe.svg" },
  Coinbase: { label: "Coinbase", src: "/logos/coinbase.svg" },
  Notion: { label: "Notion", src: "/logos/notion.svg" },
  Figma: { label: "Figma", src: "/logos/figma.svg" },
  Discord: { label: "Discord", src: "/logos/discord.svg" },
  Ramp: { label: "Ramp", src: "/logos/ramp.png" },
  Datadog: { label: "Datadog", src: "/logos/datadog.svg" },
  "Jane Street": { label: "Jane Street", src: "/logos/jane-street.svg" },
  Citadel: { label: "Citadel", src: "/logos/citadel.svg" },
  "Two Sigma": { label: "Two Sigma", src: "/logos/two-sigma.svg" },
  "Hudson River Trading": { label: "HRT", src: "/logos/hrt.svg" },
  "Jump Trading": { label: "Jump", src: "/logos/jump.svg" },
  "D.E. Shaw": { label: "D.E. Shaw", src: "/logos/deshaw.svg" },
  "Akuna Capital": { label: "Akuna", src: "/logos/akuna.svg" },
  IMC: { label: "IMC", src: "/logos/imc.png" },
  Optiver: { label: "Optiver", src: "/logos/optiver.png" },
  SpaceX: { label: "SpaceX", src: "/logos/spacex.svg" },
  Tesla: { label: "Tesla", src: "/logos/tesla.svg" },
  Neuralink: { label: "Neuralink", src: "/logos/neuralink.svg" },
  "Lockheed Martin": { label: "Lockheed Martin", src: "/logos/lockheed-martin.svg" },
  Boeing: { label: "Boeing", src: "/logos/boeing.svg" },
  "Northrop Grumman": {
    label: "Northrop Grumman",
    src: "/logos/northrop-grumman.svg",
  },
  Raytheon: { label: "Raytheon", src: "/logos/raytheon.svg" },
  "Texas Instruments": {
    label: "Texas Instruments",
    src: "/logos/texas-instruments.svg",
  },
  Qualcomm: { label: "Qualcomm", src: "/logos/qualcomm.svg" },
  ExxonMobil: { label: "ExxonMobil", src: "/logos/exxonmobil.svg" },
  Pfizer: { label: "Pfizer", src: "/logos/pfizer.svg" },
  Kalshi: { label: "Kalshi", src: "/logos/kalshi.svg" },
  "Scale AI": { label: "Scale AI", src: "/logos/scale-ai.svg" },
  "Capital One": { label: "Capital One", src: "/logos/capital-one.svg" },
};

function logoDevToken() {
  return (
    process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN?.trim() ||
    process.env.LOGO_DEV_PUBLISHABLE_KEY?.trim() ||
    ""
  );
}

/** Guess a public website domain from a company display name. */
export function guessCompanyDomain(company: string) {
  const name = company.trim();
  // Single-letter / short brands whose .com isn't `{cleaned}.com` from letters alone.
  if (/^x$/i.test(name)) return "x.com";
  if (/^x\s*\(twitter\)$/i.test(name) || /^twitter$/i.test(name)) return "x.com";

  const cleaned = name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 48);
  return cleaned ? `${cleaned}.com` : "example.com";
}

function isPureAtsHost(host: string) {
  return /greenhouse\.io|lever\.co|ashbyhq\.com|myworkdayjobs\.com|icims\.com|jobvite\.com|eightfold\.ai|gcservice/i.test(
    host,
  );
}

/**
 * Prefer a real company host from the careers URL.
 * careers.microsoft.com → microsoft.com; boards.greenhouse.io/stripe → stripe.com
 */
export function resolveCompanyLogoDomain(opts: {
  company: string;
  careersUrl?: string | null;
}): string {
  const careersUrl = opts.careersUrl?.trim();
  if (careersUrl) {
    try {
      const u = new URL(careersUrl);
      const host = u.hostname.replace(/^www\./, "").toLowerCase();
      if (host && !isPureAtsHost(host)) {
        return host.replace(/^(careers|jobs|apply|job|about|students)\./i, "");
      }
      // boards.greenhouse.io/stripe → try stripe.com
      const token = u.pathname.split("/").filter(Boolean)[0];
      if (
        token &&
        isPureAtsHost(host) &&
        /^[a-z0-9_-]+$/i.test(token)
      ) {
        return `${token.replace(/_/g, "")}.com`;
      }
    } catch {
      /* ignore */
    }
  }
  return guessCompanyDomain(opts.company);
}

function simpleIconsSlug(domain: string) {
  return domain
    .replace(/^www\./, "")
    .split(".")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Remote logo CDN URL for a domain (logo.dev when configured, else Google). */
export function remoteCompanyLogoUrl(domain: string): string {
  const d = domain
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
  const token = logoDevToken();
  if (token) {
    return `https://img.logo.dev/${encodeURIComponent(d)}?token=${encodeURIComponent(token)}&format=png&size=128&theme=dark&fallback=monogram`;
  }
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=128`;
}

async function urlLooksLikeImage(url: string, timeoutMs = 4000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "image/*,*/*" },
      redirect: "follow",
      cache: "no-store",
    });
    if (!res.ok) return false;
    const type = res.headers.get("content-type") ?? "";
    return type.startsWith("image/") || type.includes("svg");
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolve the best available logo URL for a company (curated file → Simple
 * Icons → logo.dev / Google favicon).
 */
export async function resolveCompanyLogoUrl(opts: {
  company: string;
  careersUrl?: string | null;
}): Promise<string> {
  const curated = COMPANY_LOGOS[opts.company]?.src;
  if (curated) return curated;

  const domain = resolveCompanyLogoDomain(opts);
  const slug = simpleIconsSlug(domain);
  if (slug.length >= 2) {
    const simple = `https://cdn.simpleicons.org/${slug}`;
    if (await urlLooksLikeImage(simple)) return simple;
  }

  return remoteCompanyLogoUrl(domain);
}

/**
 * Sync logo lookup for UI. Prefer curated marks, then a stored override from
 * the internship row, then a remote CDN guess from the company name.
 */
export function companyLogoUrl(
  company: string,
  storedLogoUrl?: string | null,
): string | null {
  const curated = COMPANY_LOGOS[company]?.src;
  if (curated) return curated;
  if (storedLogoUrl?.trim()) return storedLogoUrl.trim();
  const domain = guessCompanyDomain(company);
  if (!domain || domain === "example.com") return null;
  return remoteCompanyLogoUrl(domain);
}

/** Throws if any company is missing a logo entry or src. */
export function assertCompaniesHaveLogos(companies: string[]) {
  const missing = [...new Set(companies)].filter((c) => !COMPANY_LOGOS[c]?.src);
  if (missing.length > 0) {
    throw new Error(
      `Missing logos for: ${missing.join(", ")}. Add entries in src/lib/company-logos.ts and files under public/logos/.`,
    );
  }
}
