export type CompanyFilterId =
  | "all"
  | "faang"
  | "big-tech"
  | "startups"
  | "fintech"
  | "quant"
  | "ib"
  | "consulting";

export type CompanyCategoryId = Exclude<CompanyFilterId, "all">;

export type CompanyFilter = {
  id: CompanyFilterId;
  label: string;
};

/** Filter chips shown on the company picker (order = display order). */
export const COMPANY_FILTERS: CompanyFilter[] = [
  { id: "all", label: "All" },
  { id: "faang", label: "FAANG" },
  { id: "big-tech", label: "Big Tech" },
  { id: "startups", label: "Startups" },
  { id: "fintech", label: "Fintech" },
  { id: "quant", label: "Quant" },
  { id: "ib", label: "IB" },
  { id: "consulting", label: "Consulting" },
];

export const COMPANY_CATEGORY_FILTERS: CompanyFilter[] =
  COMPANY_FILTERS.filter((f) => f.id !== "all");

/**
 * Category tags per company. A company can sit in multiple buckets
 * (e.g. Amazon = FAANG + Big Tech).
 */
export const COMPANY_CATEGORIES: Record<string, CompanyCategoryId[]> = {
  Meta: ["faang", "big-tech"],
  Amazon: ["faang", "big-tech"],
  Apple: ["faang", "big-tech"],
  Netflix: ["faang", "big-tech"],
  Google: ["faang", "big-tech"],
  Microsoft: ["big-tech"],
  NVIDIA: ["big-tech"],
  Databricks: ["big-tech", "startups"],
  Palantir: ["big-tech"],
  Uber: ["big-tech"],
  Airbnb: ["big-tech"],
  Adobe: ["big-tech"],
  Salesforce: ["big-tech"],
  Oracle: ["big-tech"],
  LinkedIn: ["big-tech"],
  Roblox: ["big-tech", "startups"],
  Coinbase: ["startups", "fintech"],
  Snap: ["big-tech", "startups"],
  Spotify: ["big-tech"],
  TikTok: ["big-tech"],
  X: ["big-tech", "startups"],
  Stripe: ["startups", "fintech"],
  Notion: ["startups"],
  Figma: ["startups"],
  Discord: ["startups"],
  Ramp: ["startups", "fintech"],
  Datadog: ["big-tech"],
  "Jane Street": ["quant"],
  Citadel: ["quant"],
  "Two Sigma": ["quant"],
  "Hudson River Trading": ["quant"],
  "Jump Trading": ["quant"],
  "D.E. Shaw": ["quant"],
  "Akuna Capital": ["quant"],
  IMC: ["quant"],
  Optiver: ["quant"],
  SpaceX: ["big-tech"],
  Tesla: ["big-tech"],
  Neuralink: ["big-tech", "startups"],
  "Lockheed Martin": ["big-tech"],
  Boeing: ["big-tech"],
  "Northrop Grumman": ["big-tech"],
  Raytheon: ["big-tech"],
  "Texas Instruments": ["big-tech"],
  Qualcomm: ["big-tech"],
  ExxonMobil: ["big-tech"],
  Pfizer: ["big-tech"],
  Kalshi: ["startups", "fintech"],
  "Scale AI": ["startups", "big-tech"],
  "Capital One": ["fintech", "big-tech"],
};

export function companyMatchesFilter(
  company: string,
  filter: CompanyFilterId,
): boolean {
  if (filter === "all") return true;
  return (COMPANY_CATEGORIES[company] ?? []).includes(filter);
}

/** Match if no filters selected (show all) or company is in any selected category. */
export function companyMatchesFilters(
  company: string,
  filters: Iterable<CompanyCategoryId>,
): boolean {
  const selected = Array.from(filters);
  if (selected.length === 0) return true;
  const cats = COMPANY_CATEGORIES[company] ?? [];
  return selected.some((id) => cats.includes(id));
}

export function availableCompanyFilters(
  _companies: string[] = [],
): CompanyFilter[] {
  return COMPANY_FILTERS;
}

export function availableCompanyCategoryFilters(
  _companies: string[] = [],
): CompanyFilter[] {
  return COMPANY_CATEGORY_FILTERS;
}
