export type InternshipCatalogItem = {
  company: string;
  title: string;
  slug: string;
  description: string;
  applyUrl: string;
  sourceType: "greenhouse" | "lever" | "ashby" | "manual";
  sourceKey: string | null;
  titleFilter: string | null;
};

/**
 * Curated internship watches. Greenhouse/Lever/Ashby boards are polled
 * every second by the monitor worker for true near-instant open detection.
 */
export const INTERNSHIP_CATALOG: InternshipCatalogItem[] = [
  {
    company: "Stripe",
    title: "Software Engineering Intern",
    slug: "stripe-swe-intern",
    description: "Stripe early careers / SWE internship listings",
    applyUrl: "https://stripe.com/jobs/search?query=intern",
    sourceType: "greenhouse",
    sourceKey: "stripe",
    titleFilter: "intern",
  },
  {
    company: "Airbnb",
    title: "Software Engineering Intern",
    slug: "airbnb-swe-intern",
    description: "Airbnb university SWE internship",
    applyUrl: "https://careers.airbnb.com/",
    sourceType: "greenhouse",
    sourceKey: "airbnb",
    titleFilter: "intern",
  },
  {
    company: "Coinbase",
    title: "Software Engineering Intern",
    slug: "coinbase-swe-intern",
    description: "Coinbase internship openings",
    applyUrl: "https://www.coinbase.com/careers",
    sourceType: "greenhouse",
    sourceKey: "coinbase",
    titleFilter: "intern",
  },
  {
    company: "Notion",
    title: "Software Engineering Intern",
    slug: "notion-swe-intern",
    description: "Notion engineering internship",
    applyUrl: "https://jobs.notion.com/",
    sourceType: "greenhouse",
    sourceKey: "notion",
    titleFilter: "intern",
  },
  {
    company: "Figma",
    title: "Software Engineering Intern",
    slug: "figma-swe-intern",
    description: "Figma university / internship roles",
    applyUrl: "https://www.figma.com/careers/",
    sourceType: "greenhouse",
    sourceKey: "figma",
    titleFilter: "intern",
  },
  {
    company: "Discord",
    title: "Software Engineering Intern",
    slug: "discord-swe-intern",
    description: "Discord internship openings",
    applyUrl: "https://discord.com/careers",
    sourceType: "greenhouse",
    sourceKey: "discord",
    titleFilter: "intern",
  },
  {
    company: "Ramp",
    title: "Software Engineering Intern",
    slug: "ramp-swe-intern",
    description: "Ramp early career / intern roles",
    applyUrl: "https://ramp.com/careers",
    sourceType: "ashby",
    sourceKey: "ramp",
    titleFilter: "intern",
  },
  {
    company: "Datadog",
    title: "Software Engineering Intern",
    slug: "datadog-swe-intern",
    description: "Datadog internship openings",
    applyUrl: "https://careers.datadoghq.com/",
    sourceType: "greenhouse",
    sourceKey: "datadog",
    titleFilter: "intern",
  },
  {
    company: "DropText Demo",
    title: "Demo Internship (manual trigger)",
    slug: "droptext-demo",
    description: "Use the demo trigger to test instant SMS end-to-end",
    applyUrl: "https://localhost/demo",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: null,
  },
];
