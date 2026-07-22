import { companyLogoUrl } from "@/lib/company-logos";

/**
 * Hero marquee only — a fixed set of flagship brands.
 * New catalog companies should NOT be added here by default.
 */
const MARQUEE_COMPANIES = [
  "Meta",
  "Amazon",
  "Apple",
  "Netflix",
  "Google",
  "Microsoft",
  "NVIDIA",
  "Stripe",
  "Airbnb",
  "Uber",
  "Coinbase",
  "Notion",
  "Figma",
  "Discord",
  "Datadog",
  "LinkedIn",
  "Spotify",
  "Snap",
  "TikTok",
  "Salesforce",
  "Adobe",
  "Palantir",
  "Databricks",
  "Roblox",
  "Oracle",
] as const;

export function LogoMarquee() {
  const logos = [...MARQUEE_COMPANIES, ...MARQUEE_COMPANIES];

  return (
    <div className="logo-marquee" aria-hidden="true">
      <div className="logo-marquee-track">
        {logos.map((company, i) => {
          const src = companyLogoUrl(company);
          if (!src) return null;
          return (
            <div
              key={`${company}-${i}`}
              className="logo-marquee-item"
              title={company}
            >
              <img src={src} alt="" className="logo-marquee-img" />
              <span className="logo-marquee-name">{company}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
