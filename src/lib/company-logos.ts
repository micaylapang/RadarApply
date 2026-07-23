/**
 * Brand marks for company list UI.
 * Every catalog company MUST have a resolvable logo (`src` under /public/logos).
 * See `.cursor/rules/company-logos.mdc`.
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

export function companyLogoUrl(company: string): string | null {
  const curated = COMPANY_LOGOS[company]?.src;
  if (curated) return curated;
  // Request-approved companies: Clearbit mark until a file is added under /public/logos.
  const domain = company
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 48);
  if (!domain) return null;
  return `https://logo.clearbit.com/${domain}.com`;
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
