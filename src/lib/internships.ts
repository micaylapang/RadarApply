export type InternshipCatalogItem = {
  company: string;
  title: string;
  slug: string;
  description: string;
  applyUrl: string;
  sourceType: "greenhouse" | "lever" | "ashby" | "amazon" | "google" | "careers-page" | "manual";
  sourceKey: string | null;
  titleFilter: string | null;
};

/**
 * Curated internship watches. Greenhouse/Lever/Ashby/Amazon/Google boards are
 * polled by the monitor worker for open detection.
 * Product target: Summer 2027, US only (see matchesSummer2027 + isUsLocationHint).
 */
const RAW_CATALOG: InternshipCatalogItem[] = [
  // Meta (FAANG)
  {
    company: "Meta",
    title: "Software Engineering Intern",
    slug: "meta-swe-intern",
    description: "Meta university SWE internship",
    applyUrl: "https://www.metacareers.com/jobs?q=software%20engineer%20intern",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software Engineer",
  },
  {
    company: "Meta",
    title: "Data Science Intern",
    slug: "meta-data-intern",
    description: "Meta data science internship",
    applyUrl: "https://www.metacareers.com/jobs?q=data%20science%20intern",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Data",
  },
  {
    company: "Meta",
    title: "Product Management Intern",
    slug: "meta-pm-intern",
    description: "Meta PM internship",
    applyUrl: "https://www.metacareers.com/jobs?q=product%20manager%20intern",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Product",
  },

  // Amazon
  {
    company: "Amazon",
    title: "Software Development Engineer Intern — Summer 2027",
    slug: "amazon-sde-intern-us-summer",
    description: "Amazon US Summer 2027 SDE internship",
    applyUrl:
      "https://www.amazon.jobs/en/search?base_query=Software%20Development%20Engineer%20Internship&loc_query=United%20States",
    sourceType: "amazon",
    sourceKey: "Software Development Engineer Internship",
    // Require explicit Summer 2027 — Amazon still has Fall 2026 / foreign SDE posts.
    titleFilter: "Summer 2027",
  },

  // Apple (FAANG) — US undergrad internships from jobs.apple.com Students: Internships
  {
    company: "Apple",
    title: "Software Engineering Intern",
    slug: "apple-swe-intern",
    description: "Apple US undergrad software engineering internship",
    applyUrl:
      "https://jobs.apple.com/en-us/details/200664785-3810/software-undergrad-engineering-internships",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software Undergrad Engineering",
  },
  {
    company: "Apple",
    title: "Machine Learning Intern",
    slug: "apple-ml-intern",
    description: "Apple US undergrad machine learning / AI internship",
    applyUrl:
      "https://jobs.apple.com/en-us/details/200664780-3810/machine-learning-and-artificial-intelligence-undergrad-internships",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Machine Learning and Artificial Intelligence Undergrad",
  },
  {
    company: "Apple",
    title: "Hardware Engineering Intern",
    slug: "apple-hardware-intern",
    description: "Apple US undergrad hardware engineering internship",
    applyUrl:
      "https://jobs.apple.com/en-us/details/200663981-3810/hardware-undergrad-engineering-internships",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Hardware Undergrad Engineering",
  },
  {
    company: "Apple",
    title: "Hardware Technologies Intern",
    slug: "apple-hardware-tech-intern",
    description: "Apple US undergrad hardware technologies internship",
    applyUrl:
      "https://jobs.apple.com/en-us/details/200663968-3810/hardware-technologies-undergrad-engineering-internships",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Hardware Technologies Undergrad",
  },
  {
    company: "Apple",
    title: "Product Design Intern",
    slug: "apple-product-design-intern",
    description: "Apple US undergrad product design internship",
    applyUrl:
      "https://jobs.apple.com/en-us/details/200664000-3810/product-design-undergrad-internships",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Product Design Undergrad",
  },
  {
    company: "Apple",
    title: "Operations & Manufacturing Design Intern",
    slug: "apple-ops-mfg-design-intern",
    description: "Apple US undergrad operations & manufacturing design internship",
    applyUrl:
      "https://jobs.apple.com/en-us/details/200664002-3810/operations-manufacturing-design-undergrad-internships",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Operations Manufacturing Design Undergrad",
  },
  {
    company: "Apple",
    title: "Engineering Program Management Intern",
    slug: "apple-epm-intern",
    description: "Apple US undergrad engineering program management internship",
    applyUrl:
      "https://jobs.apple.com/en-us/details/200664330-3810/engineering-program-management-undergrad-internships",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Engineering Program Management Undergrad",
  },
  {
    company: "Apple",
    title: "Business, Marketing & Creative Intern",
    slug: "apple-bmc-intern",
    description: "Apple US undergrad business, marketing & creative internship",
    applyUrl:
      "https://jobs.apple.com/en-us/details/200664241-3810/business-marketing-creative-undergrad-internships",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Business Marketing Creative Undergrad",
  },

  // Netflix (FAANG)
  {
    company: "Netflix",
    title: "Software Engineering Intern",
    slug: "netflix-swe-intern",
    description: "Netflix US software engineering internship",
    applyUrl: "https://jobs.netflix.com/careers/internships",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software Engineer Intern",
  },
  {
    company: "Netflix",
    title: "Data Engineering Intern",
    slug: "netflix-data-intern",
    description: "Netflix US data engineering internship",
    applyUrl: "https://jobs.netflix.com/careers/internships",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Data Engineering Intern",
  },

  // Google (FAANG) — scraped from careers.google.com search HTML
  {
    company: "Google",
    title: "Software Engineering Intern",
    slug: "google-swe-intern",
    description: "Google SWE internship",
    applyUrl:
      "https://www.google.com/about/careers/applications/jobs/results/85564713261245126-software-engineering-intern-bs-summer-2027",
    sourceType: "google",
    sourceKey: "Software Engineering Intern Summer 2027",
    titleFilter: "Software Engineering Intern",
  },
  {
    company: "Google",
    title: "STEP Intern",
    slug: "google-step-intern",
    description: "Google STEP internship for first/second year students",
    applyUrl: "https://careers.google.com/jobs/results/?q=STEP%20intern",
    sourceType: "google",
    sourceKey: "STEP Intern Summer 2027",
    titleFilter: "STEP",
  },
  {
    company: "Google",
    title: "Data Science Intern",
    slug: "google-data-intern",
    description: "Google data science internship",
    applyUrl:
      "https://careers.google.com/jobs/results/?q=data%20science%20intern",
    sourceType: "google",
    sourceKey: "Data Science Intern Summer 2027",
    titleFilter: "Data Science Intern",
  },

  // Capital One
  {
    company: "Capital One",
    title: "Technology Intern",
    slug: "capital-one-tech-intern",
    description: "Capital One US Technology Internship Program",
    applyUrl: "https://www.capitalonecareers.com/internship-programs",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Technology Internship",
  },
  {
    company: "Capital One",
    title: "Data Analyst Intern",
    slug: "capital-one-data-intern",
    description: "Capital One US Data Analyst internship",
    applyUrl: "https://www.capitalonecareers.com/internship-programs",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Data Analyst Intern",
  },
  {
    company: "Capital One",
    title: "Product Development Intern",
    slug: "capital-one-product-intern",
    description: "Capital One US Product Development internship",
    applyUrl: "https://www.capitalonecareers.com/internship-programs",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Product Development",
  },

  // Stripe
  {
    company: "Stripe",
    title: "Software Engineering Intern",
    slug: "stripe-swe-intern",
    description: "Stripe US software engineering internship",
    applyUrl: "https://stripe.com/jobs/university",
    sourceType: "greenhouse",
    sourceKey: "stripe",
    titleFilter: "Software Engineer, Intern",
  },
  {
    company: "Stripe",
    title: "Product Design Intern",
    slug: "stripe-design-intern",
    description: "Stripe US product design internship",
    applyUrl: "https://stripe.com/jobs/university",
    sourceType: "greenhouse",
    sourceKey: "stripe",
    titleFilter: "Product Design Intern",
  },

  // Airbnb
  {
    company: "Airbnb",
    title: "Software Engineering Intern",
    slug: "airbnb-swe-intern",
    description: "Airbnb university SWE internship",
    applyUrl: "https://careers.airbnb.com/",
    sourceType: "greenhouse",
    sourceKey: "airbnb",
    titleFilter: "Software Engineer",
  },
  {
    company: "Airbnb",
    title: "Data Science Intern",
    slug: "airbnb-data-intern",
    description: "Airbnb data science internship",
    applyUrl: "https://careers.airbnb.com/",
    sourceType: "greenhouse",
    sourceKey: "airbnb",
    titleFilter: "Data",
  },
  {
    company: "Airbnb",
    title: "Product Design Intern",
    slug: "airbnb-design-intern",
    description: "Airbnb design internship",
    applyUrl: "https://careers.airbnb.com/",
    sourceType: "greenhouse",
    sourceKey: "airbnb",
    titleFilter: "Design",
  },

  // Coinbase
  {
    company: "Coinbase",
    title: "Software Engineering Intern",
    slug: "coinbase-swe-intern",
    description: "Coinbase US software engineering internship",
    applyUrl: "https://www.coinbase.com/careers/positions",
    sourceType: "greenhouse",
    sourceKey: "coinbase",
    titleFilter: "Software Engineer",
  },
  {
    company: "Coinbase",
    title: "Product Design Intern",
    slug: "coinbase-design-intern",
    description: "Coinbase US product design internship",
    applyUrl: "https://www.coinbase.com/careers/positions",
    sourceType: "greenhouse",
    sourceKey: "coinbase",
    titleFilter: "Product Design",
  },
  {
    company: "Coinbase",
    title: "Associate Product Manager Intern",
    slug: "coinbase-pm-intern",
    description: "Coinbase US associate product manager internship",
    applyUrl: "https://www.coinbase.com/careers/positions",
    sourceType: "greenhouse",
    sourceKey: "coinbase",
    titleFilter: "Associate Product Manager",
  },

  // Notion
  {
    company: "Notion",
    title: "Software Engineering Intern",
    slug: "notion-swe-intern",
    description: "Notion US software engineering internship",
    applyUrl: "https://www.notion.so/careers",
    sourceType: "ashby",
    sourceKey: "notion",
    titleFilter: "Software Engineer Intern",
  },

  // Figma
  {
    company: "Figma",
    title: "Software Engineering Intern",
    slug: "figma-swe-intern",
    description: "Figma US software engineering internship",
    applyUrl: "https://www.figma.com/careers/",
    sourceType: "greenhouse",
    sourceKey: "figma",
    titleFilter: "Software Engineer",
  },
  {
    company: "Figma",
    title: "Product Design Intern",
    slug: "figma-design-intern",
    description: "Figma US product design internship",
    applyUrl: "https://www.figma.com/careers/",
    sourceType: "greenhouse",
    sourceKey: "figma",
    titleFilter: "Product Design",
  },
  {
    company: "Figma",
    title: "Data Engineer Intern",
    slug: "figma-data-intern",
    description: "Figma US data engineering internship",
    applyUrl: "https://www.figma.com/careers/",
    sourceType: "greenhouse",
    sourceKey: "figma",
    titleFilter: "Data Engineer",
  },

  // Discord
  {
    company: "Discord",
    title: "Software Engineering Intern",
    slug: "discord-swe-intern",
    description: "Discord US software engineering internship",
    applyUrl: "https://discord.com/careers",
    sourceType: "greenhouse",
    sourceKey: "discord",
    titleFilter: "Software Engineer Intern",
  },

  // Ramp
  {
    company: "Ramp",
    title: "Software Engineering Intern",
    slug: "ramp-swe-intern",
    description: "Ramp US software engineering internship",
    applyUrl: "https://ramp.com/careers",
    sourceType: "ashby",
    sourceKey: "ramp",
    titleFilter: "Software Engineer",
  },
  {
    company: "Ramp",
    title: "Product Management Intern",
    slug: "ramp-pm-intern",
    description: "Ramp US product management internship",
    applyUrl: "https://ramp.com/careers",
    sourceType: "ashby",
    sourceKey: "ramp",
    titleFilter: "Product Manager",
  },

  // Datadog
  {
    company: "Datadog",
    title: "Software Engineering Intern",
    slug: "datadog-swe-intern",
    description: "Datadog SWE internship",
    applyUrl: "https://careers.datadoghq.com/",
    sourceType: "greenhouse",
    sourceKey: "datadog",
    titleFilter: "Software Engineer",
  },
  {
    company: "Datadog",
    title: "Data Science Intern",
    slug: "datadog-data-intern",
    description: "Datadog data internship",
    applyUrl: "https://careers.datadoghq.com/",
    sourceType: "greenhouse",
    sourceKey: "datadog",
    titleFilter: "Data",
  },

  // Microsoft — university internship tracks (Summer 2027 US)
  {
    company: "Microsoft",
    title: "Software Engineering Intern",
    slug: "microsoft-swe-intern",
    description: "Microsoft US software engineering internship",
    applyUrl:
      "https://jobs.careers.microsoft.com/global/en/search?q=Software%20Engineering%20Intern%20Summer%202027&lc=United%20States",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software Engineering Intern",
  },
  {
    company: "Microsoft",
    title: "Explore Intern",
    slug: "microsoft-explore-intern",
    description:
      "Microsoft Explore internship for first- and second-year undergraduates",
    applyUrl:
      "https://jobs.careers.microsoft.com/global/en/search?q=Explore%20Microsoft%20Summer%202027&lc=United%20States",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Explore",
  },
  {
    company: "Microsoft",
    title: "Discovery Intern",
    slug: "microsoft-discovery-intern",
    description:
      "Microsoft Discovery Program internship for rising first-year students (Redmond / Atlanta)",
    applyUrl:
      "https://jobs.careers.microsoft.com/global/en/search?q=Discovery%20Intern%20Summer%202027&lc=United%20States",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Discovery",
  },
  {
    company: "Microsoft",
    title: "Program Manager Intern",
    slug: "microsoft-pm-intern",
    description: "Microsoft US program manager internship",
    applyUrl:
      "https://jobs.careers.microsoft.com/global/en/search?q=Program%20Manager%20Intern%20Summer%202027&lc=United%20States",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Program Manager Intern",
  },
  {
    company: "Microsoft",
    title: "Data Science Intern",
    slug: "microsoft-data-intern",
    description: "Microsoft US data science internship",
    applyUrl:
      "https://jobs.careers.microsoft.com/global/en/search?q=Data%20Science%20Intern%20Summer%202027&lc=United%20States",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Data Science Intern",
  },
  {
    company: "Microsoft",
    title: "Research Intern",
    slug: "microsoft-research-intern",
    description: "Microsoft Research internship (typically PhD)",
    applyUrl:
      "https://jobs.careers.microsoft.com/global/en/search?q=Research%20Intern%20Summer%202027&lc=United%20States",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Research Intern",
  },
  {
    company: "Microsoft",
    title: "MBA Intern",
    slug: "microsoft-mba-intern",
    description: "Microsoft US MBA internship",
    applyUrl:
      "https://jobs.careers.microsoft.com/global/en/search?q=MBA%20Intern%20Summer%202027&lc=United%20States",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "MBA Intern",
  },
  {
    company: "Microsoft",
    title: "Hardware Engineering Intern",
    slug: "microsoft-hardware-intern",
    description: "Microsoft US hardware engineering internship",
    applyUrl:
      "https://jobs.careers.microsoft.com/global/en/search?q=Hardware%20Intern%20Summer%202027&lc=United%20States",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Hardware",
  },
  {
    company: "Microsoft",
    title: "UX Design Intern",
    slug: "microsoft-ux-intern",
    description: "Microsoft US UX / product design internship",
    applyUrl:
      "https://jobs.careers.microsoft.com/global/en/search?q=UX%20Design%20Intern%20Summer%202027&lc=United%20States",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "UX",
  },
  {
    company: "Microsoft",
    title: "Security Engineering Intern",
    slug: "microsoft-security-intern",
    description: "Microsoft US security engineering internship",
    applyUrl:
      "https://jobs.careers.microsoft.com/global/en/search?q=Security%20Intern%20Summer%202027&lc=United%20States",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Security",
  },
  {
    company: "Microsoft",
    title: "Applied Science Intern",
    slug: "microsoft-applied-science-intern",
    description: "Microsoft US applied science internship",
    applyUrl:
      "https://jobs.careers.microsoft.com/global/en/search?q=Applied%20Science%20Intern%20Summer%202027&lc=United%20States",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Applied Science",
  },
  {
    company: "Microsoft",
    title: "Finance Intern",
    slug: "microsoft-finance-intern",
    description: "Microsoft US finance internship",
    applyUrl:
      "https://jobs.careers.microsoft.com/global/en/search?q=Finance%20Intern%20Summer%202027&lc=United%20States",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Finance Intern",
  },
  {
    company: "Microsoft",
    title: "Marketing Intern",
    slug: "microsoft-marketing-intern",
    description: "Microsoft US marketing internship",
    applyUrl:
      "https://jobs.careers.microsoft.com/global/en/search?q=Marketing%20Intern%20Summer%202027&lc=United%20States",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Marketing Intern",
  },
  {
    company: "NVIDIA",
    title: "Software Engineering Intern",
    slug: "nvidia-swe-intern",
    description: "NVIDIA US software engineering internship",
    applyUrl:
      "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite?q=intern",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software",
  },
  {
    company: "NVIDIA",
    title: "Deep Learning Intern",
    slug: "nvidia-dl-intern",
    description: "NVIDIA US deep learning / AI internship",
    applyUrl:
      "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite?q=intern",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Learning",
  },
  {
    company: "Databricks",
    title: "Software Engineering Intern",
    slug: "databricks-swe-intern",
    description: "Databricks US software engineering internship",
    applyUrl: "https://www.databricks.com/company/careers",
    sourceType: "greenhouse",
    sourceKey: "databricks",
    titleFilter: "Software Engineer Intern",
  },
  {
    company: "Databricks",
    title: "Product Management Intern",
    slug: "databricks-pm-intern",
    description: "Databricks US product management internship",
    applyUrl: "https://databricks.com/company/careers/open-positions/job?gh_jid=6883068002",
    sourceType: "greenhouse",
    sourceKey: "databricks",
    titleFilter: "Product Management Intern",
  },
  {
    company: "Databricks",
    title: "Research Scientist Intern",
    slug: "databricks-research-intern",
    description: "Databricks US GenAI / research scientist internship (often PhD)",
    applyUrl: "https://www.databricks.com/company/careers",
    sourceType: "greenhouse",
    sourceKey: "databricks",
    titleFilter: "Research Scientist Intern",
  },
  {
    company: "Palantir",
    title: "Software Engineer Intern — Denver",
    slug: "palantir-swe-intern-denver",
    description: "Palantir Denver software engineering internship",
    applyUrl:
      "https://jobs.lever.co/palantir/373eb939-6f57-4836-8479-be79a5e07249",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter: "Software Engineer, Internship",
  },
  {
    company: "Palantir",
    title: "Software Engineer Intern — New York",
    slug: "palantir-swe-intern",
    description: "Palantir New York software engineering internship",
    applyUrl:
      "https://jobs.lever.co/palantir/7d69cf8a-06fd-4f05-bd84-27149db29c4d",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter: "Software Engineer, Internship",
  },
  {
    company: "Palantir",
    title: "Software Engineer Intern — Palo Alto",
    slug: "palantir-swe-intern-palo-alto",
    description: "Palantir Palo Alto software engineering internship",
    applyUrl:
      "https://jobs.lever.co/palantir/e27af7ab-41fc-40c9-b31d-02c6cb1c505c",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter: "Software Engineer, Internship",
  },
  {
    company: "Palantir",
    title: "Software Engineer Intern — Washington D.C.",
    slug: "palantir-swe-intern-dc",
    description: "Palantir Washington D.C. software engineering internship",
    applyUrl:
      "https://jobs.lever.co/palantir/bdcfb29f-4f27-42de-933f-7f83a359b9f0",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter: "Software Engineer, Internship",
  },
  {
    company: "Palantir",
    title: "Software Engineer Intern (Defense Tech) — New York",
    slug: "palantir-swe-defense-nyc",
    description: "Palantir New York Defense Tech software engineering internship",
    applyUrl:
      "https://jobs.lever.co/palantir/8bcf4f33-0a79-4248-bbfd-49ac4be9dd8e",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter: "Software Engineer, Internship - Defense Tech",
  },
  {
    company: "Palantir",
    title: "Software Engineer Intern (Defense Tech) — Palo Alto",
    slug: "palantir-swe-defense-palo-alto",
    description: "Palantir Palo Alto Defense Tech software engineering internship",
    applyUrl:
      "https://jobs.lever.co/palantir/a483f41b-0da9-42ea-8ed6-cbf6eb93cc6d",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter: "Software Engineer, Internship - Defense Tech",
  },
  {
    company: "Palantir",
    title: "Software Engineer Intern (Defense Tech) — Washington D.C.",
    slug: "palantir-swe-defense-dc",
    description:
      "Palantir Washington D.C. Defense Tech software engineering internship",
    applyUrl:
      "https://jobs.lever.co/palantir/f17e98d0-046a-4e6e-9d65-ed0b12dd0ff7",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter: "Software Engineer, Internship - Defense Tech",
  },
  {
    company: "Palantir",
    title: "Software Engineer Intern (Infrastructure) — New York",
    slug: "palantir-swe-infra-nyc",
    description: "Palantir New York infrastructure software engineering internship",
    applyUrl:
      "https://jobs.lever.co/palantir/b229baac-494b-4a0d-9a13-2e38806e06f3",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter: "Software Engineer, Internship - Infrastructure",
  },
  {
    company: "Palantir",
    title: "Software Engineer Intern (Infrastructure) — Palo Alto",
    slug: "palantir-swe-infra-palo-alto",
    description:
      "Palantir Palo Alto infrastructure software engineering internship",
    applyUrl:
      "https://jobs.lever.co/palantir/f221738b-e97c-4ce3-a12a-17ada2b855e4",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter: "Software Engineer, Internship - Infrastructure",
  },
  {
    company: "Palantir",
    title: "Software Engineer Intern (Production Infrastructure) — New York",
    slug: "palantir-swe-prod-infra-nyc",
    description:
      "Palantir New York production infrastructure software engineering internship",
    applyUrl:
      "https://jobs.lever.co/palantir/37964982-9b4c-471e-a1d8-fb8f45d7f116",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter: "Software Engineer, Internship - Production Infrastructure",
  },
  {
    company: "Palantir",
    title: "Software Engineer Intern (Production Infrastructure) — Seattle",
    slug: "palantir-swe-prod-infra-seattle",
    description:
      "Palantir Seattle production infrastructure software engineering internship",
    applyUrl:
      "https://jobs.lever.co/palantir/373367a9-3160-49d8-b7af-2efec062fad1",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter: "Software Engineer, Internship - Production Infrastructure",
  },
  {
    company: "Palantir",
    title:
      "Software Engineer Intern (Production Infrastructure) — Washington D.C.",
    slug: "palantir-swe-prod-infra-dc",
    description:
      "Palantir Washington D.C. production infrastructure software engineering internship",
    applyUrl:
      "https://jobs.lever.co/palantir/3ab9e715-1ea9-4c6c-ad50-7340eac14e86",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter: "Software Engineer, Internship - Production Infrastructure",
  },
  {
    company: "Palantir",
    title: "Privacy and Civil Liberties Software Engineer Intern — New York",
    slug: "palantir-pcl-swe-intern-nyc",
    description:
      "Palantir New York Privacy and Civil Liberties software engineering internship",
    applyUrl:
      "https://jobs.lever.co/palantir/09846827-b931-4a9f-bd64-c3bb8860187b",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter: "Privacy and Civil Liberties Software Engineer, Internship",
  },
  {
    company: "Palantir",
    title: "Forward Deployed Software Engineer Intern (Commercial) — Chicago",
    slug: "palantir-fde-commercial-chicago",
    description: "Palantir Chicago commercial forward deployed internship",
    applyUrl:
      "https://jobs.lever.co/palantir/d5486403-c050-4920-b2e0-91b69b61ebb2",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter: "Forward Deployed Software Engineer, Internship - Commercial",
  },
  {
    company: "Palantir",
    title: "Forward Deployed Software Engineer Intern (Commercial) — New York",
    slug: "palantir-fde-intern",
    description: "Palantir New York commercial forward deployed internship",
    applyUrl:
      "https://jobs.lever.co/palantir/4d29249a-d7e8-4c39-880d-3b35d7b2f6f6",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter: "Forward Deployed Software Engineer, Internship - Commercial",
  },
  {
    company: "Palantir",
    title:
      "Forward Deployed Software Engineer Intern (Defense Tech) — Washington D.C.",
    slug: "palantir-fde-defense-dc",
    description:
      "Palantir Washington D.C. Defense Tech forward deployed internship",
    applyUrl:
      "https://jobs.lever.co/palantir/cccfe1bd-f15b-4fe5-b044-c793e7961c1b",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter:
      "Forward Deployed Software Engineer, Internship - Defense Tech",
  },
  {
    company: "Palantir",
    title: "Forward Deployed Software Engineer Intern (France) — New York",
    slug: "palantir-fde-france-nyc",
    description: "Palantir New York France-desk forward deployed internship",
    applyUrl:
      "https://jobs.lever.co/palantir/ac0dc094-2480-43c2-8495-26ade227ff4f",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter: "Forward Deployed Software Engineer, Internship - France",
  },
  {
    company: "Palantir",
    title: "Forward Deployed Software Engineer Intern (Intel) — Washington D.C.",
    slug: "palantir-fde-intel-dc",
    description: "Palantir Washington D.C. Intel forward deployed internship",
    applyUrl:
      "https://jobs.lever.co/palantir/9e40d77f-b07c-437b-98e7-def9b0184d89",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter: "Forward Deployed Software Engineer, Internship - Intel",
  },
  {
    company: "Palantir",
    title: "Forward Deployed Software Engineer Intern (Poland) — New York",
    slug: "palantir-fde-poland-nyc",
    description: "Palantir New York Poland-desk forward deployed internship",
    applyUrl:
      "https://jobs.lever.co/palantir/d582cd84-14fd-4aa3-b413-15982d286bd9",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter: "Forward Deployed Software Engineer, Internship - Poland",
  },
  {
    company: "Palantir",
    title: "Forward Deployed Software Engineer Intern (US Government) — Honolulu",
    slug: "palantir-fde-usg-honolulu",
    description: "Palantir Honolulu US Government forward deployed internship",
    applyUrl:
      "https://jobs.lever.co/palantir/315f695d-04d1-4a9a-848e-cb2bec7a997e",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter:
      "Forward Deployed Software Engineer, Internship - US Government",
  },
  {
    company: "Palantir",
    title: "Forward Deployed Software Engineer Intern (US Government) — New York",
    slug: "palantir-fde-usg-nyc",
    description: "Palantir New York US Government forward deployed internship",
    applyUrl:
      "https://jobs.lever.co/palantir/e0010393-c300-446f-bf67-fa2ef067f16f",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter:
      "Forward Deployed Software Engineer, Internship - US Government",
  },
  {
    company: "Palantir",
    title:
      "Forward Deployed Software Engineer Intern (US Government) — Washington D.C.",
    slug: "palantir-fde-usg-dc",
    description:
      "Palantir Washington D.C. US Government forward deployed internship",
    applyUrl:
      "https://jobs.lever.co/palantir/e6ff8bf2-135e-474d-ad37-24f490ae1dd2",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter:
      "Forward Deployed Software Engineer, Internship - US Government",
  },
  {
    company: "Palantir",
    title:
      "Forward Deployed Infrastructure Engineer Intern (US Government) — New York",
    slug: "palantir-fdie-usg-nyc",
    description:
      "Palantir New York US Government forward deployed infrastructure internship",
    applyUrl:
      "https://jobs.lever.co/palantir/cf5f44ff-1b0b-4752-bcd4-2dc88798f25b",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter:
      "Forward Deployed Infrastructure Engineer, Internship - US Government",
  },
  {
    company: "Palantir",
    title:
      "Forward Deployed Infrastructure Engineer Intern (US Government) — Palo Alto",
    slug: "palantir-fdie-usg-palo-alto",
    description:
      "Palantir Palo Alto US Government forward deployed infrastructure internship",
    applyUrl:
      "https://jobs.lever.co/palantir/8f362a1f-1eff-4327-94c1-ff46e2101c69",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter:
      "Forward Deployed Infrastructure Engineer, Internship - US Government",
  },
  {
    company: "Palantir",
    title:
      "Forward Deployed Infrastructure Engineer Intern (US Government) — Washington D.C.",
    slug: "palantir-fdie-usg-dc",
    description:
      "Palantir Washington D.C. US Government forward deployed infrastructure internship",
    applyUrl:
      "https://jobs.lever.co/palantir/3db7e40a-28e0-4ad1-96c5-93de5bc96aa9",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter:
      "Forward Deployed Infrastructure Engineer, Internship - US Government",
  },
  {
    company: "Palantir",
    title: "Deployment Strategist Intern (US Government) — Honolulu",
    slug: "palantir-ds-usg-honolulu",
    description: "Palantir Honolulu US Government deployment strategist internship",
    applyUrl:
      "https://jobs.lever.co/palantir/a49d4181-a289-435a-b581-7f5af0497c8e",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter: "Deployment Strategist, Internship - US Government",
  },
  {
    company: "Palantir",
    title:
      "Year at Palantir Forward Deployed Software Engineer Intern (Commercial) — Chicago",
    slug: "palantir-yap-fde-commercial-chicago",
    description:
      "Palantir Chicago Year at Palantir commercial forward deployed internship",
    applyUrl:
      "https://jobs.lever.co/palantir/75cc1c09-8ebd-44c8-b3bc-d122cd1fecb3",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter:
      "Year at Palantir - Forward Deployed Software Engineer, Internship - Commercial",
  },
  {
    company: "Palantir",
    title:
      "Year at Palantir Forward Deployed Software Engineer Intern (Commercial) — New York",
    slug: "palantir-yap-fde-commercial-nyc",
    description:
      "Palantir New York Year at Palantir commercial forward deployed internship",
    applyUrl:
      "https://jobs.lever.co/palantir/e6789b17-62fb-4226-a079-f8c17ff19e2d",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter:
      "Year at Palantir - Forward Deployed Software Engineer, Internship - Commercial",
  },
  {
    company: "Palantir",
    title:
      "Year at Palantir Forward Deployed Software Engineer Intern (US Government) — New York",
    slug: "palantir-yap-fde-usg-nyc",
    description:
      "Palantir New York Year at Palantir US Government forward deployed internship",
    applyUrl:
      "https://jobs.lever.co/palantir/5c7bb70c-83ea-43e7-8055-0c8f319f4333",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter:
      "Year at Palantir - Forward Deployed Software Engineer, Internship - USG",
  },
  {
    company: "Palantir",
    title:
      "Year at Palantir Forward Deployed Software Engineer Intern (US Government) — Washington D.C.",
    slug: "palantir-yap-fde-usg-dc",
    description:
      "Palantir Washington D.C. Year at Palantir US Government forward deployed internship",
    applyUrl:
      "https://jobs.lever.co/palantir/5c4c65c5-77da-4d36-856c-4ade87631019",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter:
      "Year at Palantir - Forward Deployed Software Engineer, Internship - USG",
  },
  {
    company: "Palantir",
    title: "Year at Palantir Software Engineer Intern — New York",
    slug: "palantir-yap-swe-nyc",
    description: "Palantir New York Year at Palantir software engineering internship",
    applyUrl:
      "https://jobs.lever.co/palantir/655f9937-a4ce-4e7d-80e2-a6659af07329",
    sourceType: "lever",
    sourceKey: "palantir",
    titleFilter: "Year at Palantir - Software Engineer, Internship",
  },
  {
    company: "Uber",
    title: "Software Engineering Intern",
    slug: "uber-swe-intern",
    description: "Uber US software engineering internship",
    applyUrl: "https://www.uber.com/us/en/careers/students/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software",
  },
  {
    company: "Uber",
    title: "Data Science Intern",
    slug: "uber-data-intern",
    description: "Uber US data science internship",
    applyUrl: "https://www.uber.com/us/en/careers/students/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Data",
  },
  {
    company: "Adobe",
    title: "Software Engineering Intern",
    slug: "adobe-swe-intern",
    description: "Adobe US software engineering internship",
    applyUrl: "https://careers.adobe.com/us/en/students",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software",
  },
  {
    company: "Adobe",
    title: "Product Management Intern",
    slug: "adobe-pm-intern",
    description: "Adobe US product management internship",
    applyUrl: "https://careers.adobe.com/us/en/students",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Product",
  },
  {
    company: "Salesforce",
    title: "Software Engineering Intern",
    slug: "salesforce-swe-intern",
    description: "Salesforce US software engineering internship",
    applyUrl: "https://careers.salesforce.com/en/students/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software",
  },
  {
    company: "Salesforce",
    title: "Product Management Intern",
    slug: "salesforce-pm-intern",
    description: "Salesforce US product management internship",
    applyUrl: "https://careers.salesforce.com/en/students/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Product",
  },
  {
    company: "Oracle",
    title: "Software Engineering Intern",
    slug: "oracle-swe-intern",
    description: "Oracle US software engineering internship",
    applyUrl: "https://www.oracle.com/careers/students-grads/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software",
  },
  {
    company: "Oracle",
    title: "Product Management Intern",
    slug: "oracle-pm-intern",
    description: "Oracle US product management internship",
    applyUrl: "https://www.oracle.com/careers/students-grads/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Product",
  },
  {
    company: "LinkedIn",
    title: "Software Engineering Intern",
    slug: "linkedin-swe-intern",
    description: "LinkedIn US software engineering internship",
    applyUrl: "https://careers.linkedin.com/students",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software",
  },
  {
    company: "LinkedIn",
    title: "Data Science Intern",
    slug: "linkedin-data-intern",
    description: "LinkedIn US data science internship",
    applyUrl: "https://careers.linkedin.com/students",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Data",
  },
  {
    company: "Roblox",
    title: "Software Engineering Intern",
    slug: "roblox-swe-intern",
    description: "Roblox US software engineering internship",
    applyUrl: "https://careers.roblox.com/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software",
  },
  {
    company: "Roblox",
    title: "Product Management Intern",
    slug: "roblox-pm-intern",
    description: "Roblox US product management internship",
    applyUrl: "https://careers.roblox.com/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Product",
  },
  {
    company: "Snap",
    title: "Software Engineering Intern",
    slug: "snap-swe-intern",
    description: "Snap US software engineering internship",
    applyUrl: "https://careers.snap.com/jobs",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software",
  },
  {
    company: "Snap",
    title: "Machine Learning Intern",
    slug: "snap-ml-intern",
    description: "Snap US machine learning internship",
    applyUrl: "https://careers.snap.com/jobs",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Machine Learning",
  },
  {
    company: "Spotify",
    title: "Software Engineering Intern",
    slug: "spotify-swe-intern",
    description: "Spotify US software engineering internship",
    applyUrl: "https://www.lifeatspotify.com/students",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software",
  },
  {
    company: "Spotify",
    title: "Data Science Intern",
    slug: "spotify-data-intern",
    description: "Spotify US data science internship",
    applyUrl: "https://www.lifeatspotify.com/students",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Data",
  },
  {
    company: "TikTok",
    title: "Software Engineering Intern",
    slug: "tiktok-swe-intern",
    description: "TikTok / ByteDance US software engineering internship",
    applyUrl: "https://careers.tiktok.com/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software",
  },
  {
    company: "TikTok",
    title: "Machine Learning Intern",
    slug: "tiktok-ml-intern",
    description: "TikTok / ByteDance US machine learning internship",
    applyUrl: "https://careers.tiktok.com/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Machine Learning",
  },
  {
    company: "TikTok",
    title: "Data Science Intern",
    slug: "tiktok-data-intern",
    description: "TikTok / ByteDance US data science internship",
    applyUrl: "https://careers.tiktok.com/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Data",
  },

  // Quant
  {
    company: "Jane Street",
    title: "Software Engineer Intern",
    slug: "jane-street-swe-intern",
    description: "Jane Street US software engineering internship",
    applyUrl:
      "https://www.janestreet.com/join-jane-street/internships/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software",
  },
  {
    company: "Jane Street",
    title: "Quantitative Trading Intern",
    slug: "jane-street-trading-intern",
    description: "Jane Street US quantitative trading internship",
    applyUrl:
      "https://www.janestreet.com/join-jane-street/position/8617344002/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Quantitative Trader",
  },
  {
    company: "Jane Street",
    title: "Quantitative Research Intern",
    slug: "jane-street-qr-intern",
    description: "Jane Street US quantitative research internship",
    applyUrl:
      "https://www.janestreet.com/join-jane-street/position/8498547002/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Quantitative Research",
  },
  {
    company: "Citadel",
    title: "Software Engineer Intern",
    slug: "citadel-swe-intern",
    description: "Citadel US software engineering internship",
    applyUrl: "https://www.citadel.com/careers/details/software-engineer-intern-us/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software",
  },
  {
    company: "Citadel",
    title: "Quantitative Research Analyst Intern",
    slug: "citadel-qr-intern",
    description: "Citadel US quantitative research analyst internship (BS/MS)",
    applyUrl:
      "https://www.citadel.com/careers/details/quantitative-research-analyst-intern-bs-ms-us/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Quantitative",
  },
  {
    company: "Citadel",
    title: "Investment & Trading Intern",
    slug: "citadel-trading-intern",
    description: "Citadel US investment & trading internship",
    applyUrl:
      "https://www.citadel.com/careers/details/investment-trading-intern-us/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Trading",
  },
  {
    company: "Two Sigma",
    title: "AI Research Scientist Intern",
    slug: "two-sigma-ai-research-intern",
    description: "Two Sigma US AI research scientist internship",
    applyUrl:
      "https://careers.twosigma.com/careers/JobDetail/New-York-New-York-United-States-AI-Research-Scientist-Intern-2027-Summer/14096",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "AI Research",
  },
  {
    company: "Two Sigma",
    title: "Quantitative Researcher Intern",
    slug: "two-sigma-qr-intern",
    description: "Two Sigma US quantitative researcher internship",
    applyUrl:
      "https://careers.twosigma.com/careers/JobDetail/New-York-New-York-United-States-Quantitative-Researcher-Intern-2027-Summer/13945",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Quantitative",
  },
  {
    company: "Hudson River Trading",
    title: "Software Engineer Intern",
    slug: "hrt-swe-intern",
    description: "HRT US software engineering internship",
    applyUrl:
      "https://www.hudsonrivertrading.com/hrt-job/software-engineering-internship-c-or-python-summer-2027/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software Engineering",
  },
  {
    company: "Hudson River Trading",
    title: "Algorithm Developer Intern",
    slug: "hrt-algo-intern",
    description: "HRT US algorithm / quant internship",
    applyUrl:
      "https://www.hudsonrivertrading.com/hrt-job/algorithm-development-quant-research-internship-summer-2027/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Algorithm Development",
  },
  {
    company: "Jump Trading",
    title: "Software Engineer Intern",
    slug: "jump-swe-intern",
    description: "Jump Trading US campus software engineering internship",
    applyUrl: "https://www.jumptrading.com/hr/job?gh_jid=8002989",
    sourceType: "greenhouse",
    sourceKey: "jumptrading",
    titleFilter: "Campus Software Engineer",
  },
  {
    company: "Jump Trading",
    title: "Quantitative Researcher Intern",
    slug: "jump-qr-intern",
    description: "Jump Trading US campus quantitative research internship",
    applyUrl: "https://www.jumptrading.com/hr/job?gh_jid=8049938",
    sourceType: "greenhouse",
    sourceKey: "jumptrading",
    titleFilter: "Campus Quantitative Researcher",
  },
  {
    company: "Jump Trading",
    title: "Quantitative Trader Intern",
    slug: "jump-trader-intern",
    description: "Jump Trading US campus quantitative trading internship",
    applyUrl: "https://www.jumptrading.com/hr/job?gh_jid=7848371",
    sourceType: "greenhouse",
    sourceKey: "jumptrading",
    titleFilter: "Campus Quantitative Trader",
  },
  {
    company: "D.E. Shaw",
    title: "Software Developer Intern",
    slug: "deshaw-swe-intern",
    description: "D.E. Shaw US software developer internship",
    applyUrl:
      "https://www.deshaw.com/careers/software-developer-intern-new-york-summer-2027-5894",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software Developer",
  },
  {
    company: "D.E. Shaw",
    title: "Quantitative Analyst Intern",
    slug: "deshaw-qr-intern",
    description: "D.E. Shaw US quantitative analyst internship",
    applyUrl:
      "https://www.deshaw.com/careers/quantitative-analyst-intern-new-york-summer-2027-5890",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Quantitative Analyst",
  },
  {
    company: "Akuna Capital",
    title: "Software Engineer Intern - C++",
    slug: "akuna-swe-cpp-intern",
    description: "Akuna Capital Chicago C++ software engineering internship",
    applyUrl: "https://www.akunacapital.com/careers/job/8018847/?gh_jid=8018847",
    sourceType: "greenhouse",
    sourceKey: "akunacapital",
    titleFilter: "Software Engineer Intern - C++, Summer 2027",
  },
  {
    company: "Akuna Capital",
    title: "Software Engineer Intern - Python",
    slug: "akuna-swe-python-intern",
    description: "Akuna Capital Chicago Python software engineering internship",
    applyUrl: "https://www.akunacapital.com/careers/job/8018853/?gh_jid=8018853",
    sourceType: "greenhouse",
    sourceKey: "akunacapital",
    titleFilter: "Software Engineer Intern - Python, Summer 2027",
  },
  {
    company: "Akuna Capital",
    title: "Software Engineer Intern - C# .NET Desktop",
    slug: "akuna-swe-csharp-intern",
    description: "Akuna Capital Chicago C# .NET desktop engineering internship",
    applyUrl: "https://www.akunacapital.com/careers/job/8018886/?gh_jid=8018886",
    sourceType: "greenhouse",
    sourceKey: "akunacapital",
    titleFilter: "Software Engineer Intern - C# .NET Desktop, Summer 2027",
  },
  {
    company: "Akuna Capital",
    title: "Software Engineer Intern - Full Stack Web",
    slug: "akuna-swe-fullstack-intern",
    description: "Akuna Capital Chicago full stack web engineering internship",
    applyUrl: "https://www.akunacapital.com/careers/job/8018893/?gh_jid=8018893",
    sourceType: "greenhouse",
    sourceKey: "akunacapital",
    titleFilter: "Software Engineer Intern - Full Stack Web, Summer 2027",
  },
  {
    company: "Akuna Capital",
    title: "Hardware Engineer Intern",
    slug: "akuna-hardware-intern",
    description: "Akuna Capital Chicago hardware engineering internship",
    applyUrl: "https://www.akunacapital.com/careers/job/8018880/?gh_jid=8018880",
    sourceType: "greenhouse",
    sourceKey: "akunacapital",
    titleFilter: "Hardware Engineer Intern, Summer 2027",
  },
  {
    company: "Akuna Capital",
    title: "Platform Engineer Intern",
    slug: "akuna-platform-intern",
    description: "Akuna Capital Chicago platform engineering internship",
    applyUrl: "https://www.akunacapital.com/careers/job/8018856/?gh_jid=8018856",
    sourceType: "greenhouse",
    sourceKey: "akunacapital",
    titleFilter: "Platform Engineer Intern, Summer 2027",
  },
  {
    company: "Akuna Capital",
    title: "Quantitative Research Intern",
    slug: "akuna-qr-intern",
    description: "Akuna Capital Chicago quantitative research internship",
    applyUrl: "https://www.akunacapital.com/careers/job/8036614/?gh_jid=8036614",
    sourceType: "greenhouse",
    sourceKey: "akunacapital",
    titleFilter: "Quantitative Research Intern, Summer 2027",
  },
  {
    company: "Akuna Capital",
    title: "Quantitative Development & Strategy Intern",
    slug: "akuna-qd-intern",
    description: "Akuna Capital Chicago quant development & strategy internship",
    applyUrl: "https://www.akunacapital.com/careers/job/8021481/?gh_jid=8021481",
    sourceType: "greenhouse",
    sourceKey: "akunacapital",
    titleFilter: "Quantitative Development & Strategy Intern, Summer 2027",
  },
  {
    company: "IMC",
    title: "Software Engineer Intern",
    slug: "imc-swe-intern",
    description: "IMC Chicago software engineering internship",
    applyUrl: "https://job-boards.eu.greenhouse.io/imc/jobs/4823924101",
    sourceType: "greenhouse",
    sourceKey: "imc",
    titleFilter: "Software Engineer Intern - Summer 2027",
  },
  {
    company: "IMC",
    title: "Quantitative Research Intern",
    slug: "imc-qr-intern",
    description: "IMC Chicago quantitative research internship",
    applyUrl: "https://job-boards.eu.greenhouse.io/imc/jobs/4907399101",
    sourceType: "greenhouse",
    sourceKey: "imc",
    titleFilter: "Quantitative Research Intern (BS/MS) - Summer 2027",
  },
  {
    company: "IMC",
    title: "Quantitative Trader Intern",
    slug: "imc-trader-intern",
    description: "IMC Chicago quantitative trader internship",
    applyUrl: "https://job-boards.eu.greenhouse.io/imc/jobs/4823923101",
    sourceType: "greenhouse",
    sourceKey: "imc",
    titleFilter: "Quantitative Trader Intern - Summer 2027",
  },
  {
    company: "IMC",
    title: "Hardware Engineer Intern",
    slug: "imc-hardware-intern",
    description: "IMC Chicago hardware engineering internship",
    applyUrl: "https://job-boards.eu.greenhouse.io/imc/jobs/4823945101",
    sourceType: "greenhouse",
    sourceKey: "imc",
    titleFilter: "Hardware Engineer Intern - Summer 2027",
  },
  {
    company: "Optiver",
    title: "Software Engineer Intern — Chicago",
    slug: "optiver-swe-intern",
    description: "Optiver Chicago software engineering internship",
    applyUrl:
      "https://www.optiver.com/join-us/jobs/technology/chicago/software-engineer-intern-summer-2027-chicago/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software Engineer Intern",
  },
  {
    company: "Optiver",
    title: "Software Engineer Intern — Austin",
    slug: "optiver-swe-intern-austin",
    description: "Optiver Austin software engineering internship",
    applyUrl:
      "https://www.optiver.com/join-us/jobs/technology/austin/software-engineer-intern-summer-2027-austin/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software Engineer Intern",
  },
  {
    company: "Optiver",
    title: "Trading Automation and Operations Intern — Chicago",
    slug: "optiver-trading-ops-intern",
    description: "Optiver Chicago trading automation and operations internship",
    applyUrl:
      "https://www.optiver.com/join-us/jobs/institutional-sales-and-trading/chicago/trading-automation-and-operations-intern-summer-2027/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Trading Automation",
  },
  {
    company: "Optiver",
    title: "Quantitative Intern — Chicago",
    slug: "optiver-quantitative-intern",
    description: "Optiver Chicago quantitative intern (trading or research)",
    applyUrl:
      "https://www.optiver.com/join-us/jobs/institutional-sales-and-trading/chicago/quantitative-intern-summer-2027/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Quantitative Intern",
  },
  {
    company: "Optiver",
    title: "FPGA Engineer Intern — Austin",
    slug: "optiver-fpga-intern",
    description: "Optiver Austin FPGA engineering internship",
    applyUrl:
      "https://www.optiver.com/join-us/jobs/technology/austin/fpga-engineer-intern-summer-2027-austin/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "FPGA Engineer Intern",
  },
  {
    company: "Optiver",
    title: "FPGA Engineer Intern — Chicago",
    slug: "optiver-fpga-intern-chicago",
    description: "Optiver Chicago FPGA engineering internship",
    applyUrl:
      "https://www.optiver.com/join-us/jobs/technology/chicago/fpga-engineer-intern-summer-2027-chicago/",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "FPGA Engineer Intern",
  },

  // Aerospace & defense
  {
    company: "SpaceX",
    title: "Software Engineering Intern",
    slug: "spacex-swe-intern",
    description: "SpaceX US software engineering internship",
    applyUrl: "https://www.spacex.com/careers/",
    sourceType: "greenhouse",
    sourceKey: "spacex",
    titleFilter: "2027 Software Engineering Internship",
  },
  {
    company: "SpaceX",
    title: "Engineering Intern",
    slug: "spacex-eng-intern",
    description: "SpaceX US engineering internship",
    applyUrl: "https://www.spacex.com/careers/",
    sourceType: "greenhouse",
    sourceKey: "spacex",
    titleFilter: "2027 Engineering Internship",
  },
  {
    company: "Tesla",
    title: "Software Engineer Intern",
    slug: "tesla-swe-intern",
    description: "Tesla US software engineering internship",
    applyUrl: "https://www.tesla.com/careers/search/?query=software%20intern",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software",
  },
  {
    company: "Tesla",
    title: "Mechanical Engineer Intern",
    slug: "tesla-me-intern",
    description: "Tesla US mechanical engineering internship",
    applyUrl: "https://www.tesla.com/careers/search/?query=mechanical%20intern",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Mechanical",
  },
  {
    company: "Tesla",
    title: "Electrical Engineer Intern",
    slug: "tesla-ee-intern",
    description: "Tesla US electrical engineering internship",
    applyUrl: "https://www.tesla.com/careers/search/?query=electrical%20intern",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Electrical",
  },
  {
    company: "Neuralink",
    title: "Analog and Mixed-Signal IC Design Engineer Intern",
    slug: "neuralink-analog-ic-intern",
    description: "Neuralink analog / mixed-signal IC design internship (Fall 2026)",
    applyUrl:
      "https://boards.greenhouse.io/neuralink/jobs/7565469003?gh_jid=7565469003",
    sourceType: "greenhouse",
    sourceKey: "neuralink",
    titleFilter: "Analog and Mixed-Signal IC Design Engineer Intern",
  },
  {
    company: "Neuralink",
    title: "Digital IC Design Engineer Intern",
    slug: "neuralink-digital-ic-intern",
    description: "Neuralink digital IC design internship (Fall 2026)",
    applyUrl:
      "https://boards.greenhouse.io/neuralink/jobs/7090489003?gh_jid=7090489003",
    sourceType: "greenhouse",
    sourceKey: "neuralink",
    titleFilter: "Digital IC Design Engineer Intern",
  },
  {
    company: "Neuralink",
    title: "Electrical Engineer Intern, Implant Embedded Systems",
    slug: "neuralink-ee-implant-intern",
    description: "Neuralink implant embedded electrical engineering internship (Fall 2026)",
    applyUrl:
      "https://boards.greenhouse.io/neuralink/jobs/7702527003?gh_jid=7702527003",
    sourceType: "greenhouse",
    sourceKey: "neuralink",
    titleFilter: "Electrical Engineer Intern, Implant Embedded Systems",
  },
  {
    company: "Neuralink",
    title: "Embedded Software Engineer Intern, Implant Embedded Systems",
    slug: "neuralink-embedded-intern",
    description: "Neuralink implant embedded software internship (Fall 2026)",
    applyUrl:
      "https://boards.greenhouse.io/neuralink/jobs/6283663003?gh_jid=6283663003",
    sourceType: "greenhouse",
    sourceKey: "neuralink",
    titleFilter: "Embedded Software Engineer Intern, Implant Embedded Systems",
  },
  {
    company: "Neuralink",
    title: "Firmware Engineer Intern, Robotics and Surgery Engineering",
    slug: "neuralink-firmware-intern",
    description: "Neuralink robotics/surgery firmware internship (Fall 2026)",
    applyUrl:
      "https://boards.greenhouse.io/neuralink/jobs/6648992003?gh_jid=6648992003",
    sourceType: "greenhouse",
    sourceKey: "neuralink",
    titleFilter: "Firmware Engineer Intern, Robotics and Surgery Engineering",
  },
  {
    company: "Neuralink",
    title: "IT Systems Administrator Intern",
    slug: "neuralink-it-intern",
    description: "Neuralink IT systems administrator internship (Fall 2026)",
    applyUrl:
      "https://boards.greenhouse.io/neuralink/jobs/7736276003?gh_jid=7736276003",
    sourceType: "greenhouse",
    sourceKey: "neuralink",
    titleFilter: "IT Systems Administrator Intern",
  },
  {
    company: "Neuralink",
    title: "Machine Learning Engineer Intern",
    slug: "neuralink-ml-intern",
    description: "Neuralink machine learning internship (Fall 2026)",
    applyUrl:
      "https://boards.greenhouse.io/neuralink/jobs/6594261003?gh_jid=6594261003",
    sourceType: "greenhouse",
    sourceKey: "neuralink",
    titleFilter: "Machine Learning Engineer Intern",
  },
  {
    company: "Neuralink",
    title: "Manufacturing Intern, Surgery & Robot Hardware",
    slug: "neuralink-mfg-intern",
    description: "Neuralink surgery & robot hardware manufacturing internship (Fall 2026)",
    applyUrl:
      "https://boards.greenhouse.io/neuralink/jobs/7666761003?gh_jid=7666761003",
    sourceType: "greenhouse",
    sourceKey: "neuralink",
    titleFilter: "Manufacturing Intern, Surgery & Robot Hardware",
  },
  {
    company: "Neuralink",
    title: "Mechanical Engineering Intern, Brain Interfaces",
    slug: "neuralink-me-brain-intern",
    description: "Neuralink brain interfaces mechanical engineering internship (Fall 2026)",
    applyUrl:
      "https://boards.greenhouse.io/neuralink/jobs/6545426003?gh_jid=6545426003",
    sourceType: "greenhouse",
    sourceKey: "neuralink",
    titleFilter: "Mechanical Engineering Intern, Brain Interfaces",
  },
  {
    company: "Neuralink",
    title: "Mechanical Engineering Intern, Robotics",
    slug: "neuralink-me-robotics-intern",
    description: "Neuralink robotics mechanical engineering internship (Fall 2026)",
    applyUrl:
      "https://boards.greenhouse.io/neuralink/jobs/6514169003?gh_jid=6514169003",
    sourceType: "greenhouse",
    sourceKey: "neuralink",
    titleFilter: "Mechanical Engineering Intern, Robotics",
  },
  {
    company: "Neuralink",
    title: "Neuroengineer Intern",
    slug: "neuralink-neuro-intern",
    description: "Neuralink neuroengineering internship (Fall 2026)",
    applyUrl:
      "https://boards.greenhouse.io/neuralink/jobs/7483748003?gh_jid=7483748003",
    sourceType: "greenhouse",
    sourceKey: "neuralink",
    titleFilter: "Neuroengineer Intern",
  },
  {
    company: "Neuralink",
    title: "R&D Materials Engineer Intern",
    slug: "neuralink-materials-intern",
    description: "Neuralink R&D materials engineering internship (Fall 2026)",
    applyUrl:
      "https://boards.greenhouse.io/neuralink/jobs/7808233003?gh_jid=7808233003",
    sourceType: "greenhouse",
    sourceKey: "neuralink",
    titleFilter: "R&D Materials Engineer Intern",
  },
  {
    company: "Neuralink",
    title: "Robot Optics Intern",
    slug: "neuralink-optics-intern",
    description: "Neuralink robot optics internship (Fall 2026)",
    applyUrl:
      "https://boards.greenhouse.io/neuralink/jobs/6576326003?gh_jid=6576326003",
    sourceType: "greenhouse",
    sourceKey: "neuralink",
    titleFilter: "Robot Optics Intern",
  },
  {
    company: "Neuralink",
    title: "Software Engineer Intern, BCI Applications",
    slug: "neuralink-swe-bci-intern",
    description: "Neuralink BCI applications software internship (Fall 2026)",
    applyUrl:
      "https://boards.greenhouse.io/neuralink/jobs/6594422003?gh_jid=6594422003",
    sourceType: "greenhouse",
    sourceKey: "neuralink",
    titleFilter: "Software Engineer Intern, BCI Applications",
  },
  {
    company: "Neuralink",
    title: "Software Engineer Intern, Implant",
    slug: "neuralink-swe-implant-intern",
    description: "Neuralink implant software internship (Fall 2026)",
    applyUrl:
      "https://boards.greenhouse.io/neuralink/jobs/6569018003?gh_jid=6569018003",
    sourceType: "greenhouse",
    sourceKey: "neuralink",
    titleFilter: "Software Engineer Intern, Implant",
  },
  {
    company: "Neuralink",
    title: "Software Engineer Intern, Infrastructure",
    slug: "neuralink-swe-infra-intern",
    description: "Neuralink infrastructure software internship (Fall 2026)",
    applyUrl:
      "https://boards.greenhouse.io/neuralink/jobs/5469298003?gh_jid=5469298003",
    sourceType: "greenhouse",
    sourceKey: "neuralink",
    titleFilter: "Software Engineer Intern, Infrastructure",
  },
  {
    company: "Neuralink",
    title: "Software Engineer Intern, Internal Apps",
    slug: "neuralink-swe-internal-apps-intern",
    description: "Neuralink internal apps software internship (Fall 2026)",
    applyUrl:
      "https://boards.greenhouse.io/neuralink/jobs/6083322003?gh_jid=6083322003",
    sourceType: "greenhouse",
    sourceKey: "neuralink",
    titleFilter: "Software Engineer Intern, Internal Apps",
  },
  {
    company: "Neuralink",
    title: "Software Engineer Intern, Robotics",
    slug: "neuralink-swe-robotics-intern",
    description: "Neuralink robotics software internship (Fall 2026)",
    applyUrl:
      "https://boards.greenhouse.io/neuralink/jobs/5469305003?gh_jid=5469305003",
    sourceType: "greenhouse",
    sourceKey: "neuralink",
    titleFilter: "Software Engineer Intern, Robotics",
  },
  {
    company: "Lockheed Martin",
    title: "Software Engineer Intern",
    slug: "lockheed-swe-intern",
    description: "Lockheed Martin US software engineering internship",
    applyUrl: "https://www.lockheedmartinjobs.com/search-jobs/Intern",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software",
  },
  {
    company: "Lockheed Martin",
    title: "Systems Engineer Intern",
    slug: "lockheed-systems-intern",
    description: "Lockheed Martin US systems engineering internship",
    applyUrl: "https://www.lockheedmartinjobs.com/search-jobs/Intern",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Systems",
  },
  {
    company: "Boeing",
    title: "Software Engineer Intern",
    slug: "boeing-swe-intern",
    description: "Boeing US software engineering internship",
    applyUrl:
      "https://jobs.boeing.com/category/internships-and-apprenticeships-jobs/18595/69894/1",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software",
  },
  {
    company: "Boeing",
    title: "Engineering Intern",
    slug: "boeing-eng-intern",
    description: "Boeing US engineering internship",
    applyUrl:
      "https://jobs.boeing.com/category/internships-and-apprenticeships-jobs/18595/69894/1",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Engineering",
  },
  {
    company: "Northrop Grumman",
    title: "Software Engineer Intern",
    slug: "northrop-swe-intern",
    description: "Northrop Grumman US software engineering internship",
    applyUrl: "https://jobs.northropgrumman.com/careers",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software",
  },
  {
    company: "Northrop Grumman",
    title: "Engineering Intern",
    slug: "northrop-eng-intern",
    description: "Northrop Grumman US engineering internship",
    applyUrl: "https://jobs.northropgrumman.com/careers",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Engineering",
  },
  {
    company: "Raytheon",
    title: "Software Engineer Intern",
    slug: "raytheon-swe-intern",
    description: "Raytheon (RTX) US software engineering internship",
    applyUrl: "https://careers.rtx.com/global/en",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software",
  },
  {
    company: "Raytheon",
    title: "Engineering Intern",
    slug: "raytheon-eng-intern",
    description: "Raytheon (RTX) US engineering internship",
    applyUrl: "https://careers.rtx.com/global/en",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Engineering",
  },
  {
    company: "Texas Instruments",
    title: "Software Engineer Intern",
    slug: "ti-swe-intern",
    description: "Texas Instruments US software engineering internship",
    applyUrl: "https://careers.ti.com/en/sites/CX/pages/students-new-grads",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software",
  },
  {
    company: "Texas Instruments",
    title: "Electrical Engineer Intern",
    slug: "ti-ee-intern",
    description: "Texas Instruments US electrical engineering internship",
    applyUrl: "https://careers.ti.com/en/sites/CX/pages/students-new-grads",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Electrical",
  },
  {
    company: "Qualcomm",
    title: "Software Engineer Intern",
    slug: "qualcomm-swe-intern",
    description: "Qualcomm US software engineering internship",
    applyUrl: "https://careers.qualcomm.com/careers",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Software",
  },
  {
    company: "Qualcomm",
    title: "Hardware Engineer Intern",
    slug: "qualcomm-hw-intern",
    description: "Qualcomm US hardware engineering internship",
    applyUrl: "https://careers.qualcomm.com/careers",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Hardware",
  },
  {
    company: "ExxonMobil",
    title: "Engineering Intern",
    slug: "exxonmobil-eng-intern",
    description: "ExxonMobil US engineering internship",
    applyUrl:
      "https://jobs.exxonmobil.com/search/?createNewAlert=false&q=intern&locationsearch=",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Engineering",
  },
  {
    company: "ExxonMobil",
    title: "IT / Digital Intern",
    slug: "exxonmobil-swe-intern",
    description: "ExxonMobil US IT / digital internship",
    applyUrl:
      "https://jobs.exxonmobil.com/search/?createNewAlert=false&q=intern&locationsearch=",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "IT",
  },
  {
    company: "Pfizer",
    title: "Digital Intern",
    slug: "pfizer-swe-intern",
    description: "Pfizer US digital / technology internship",
    applyUrl: "https://pfizer.wd1.myworkdayjobs.com/PfizerCareers?q=intern",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Digital",
  },
  {
    company: "Pfizer",
    title: "Data Science Intern",
    slug: "pfizer-data-intern",
    description: "Pfizer US data science internship",
    applyUrl: "https://pfizer.wd1.myworkdayjobs.com/PfizerCareers?q=intern",
    sourceType: "manual",
    sourceKey: null,
    titleFilter: "Data",
  },

  // Kalshi
  {
    company: "Kalshi",
    title: "Support Ops Intern",
    slug: "kalshi-support-ops-intern",
    description: "Kalshi US Support Ops internship",
    applyUrl:
      "https://jobs.ashbyhq.com/kalshi/32bbed2f-888b-406f-873f-d299062fc854",
    sourceType: "ashby",
    sourceKey: "kalshi",
    titleFilter: "Support Ops",
  },

  // Scale AI
  {
    company: "Scale AI",
    title: "AI Builder Intern",
    slug: "scale-ai-builder-intern",
    description: "Scale AI US AI Builder internship",
    applyUrl: "https://job-boards.greenhouse.io/scaleai/jobs/4703343005",
    sourceType: "greenhouse",
    sourceKey: "scaleai",
    titleFilter: "AI Builder Intern",
  },
];

function withSeasonLabel(item: InternshipCatalogItem): InternshipCatalogItem {
  let title = item.title;
  let description = item.description;

  // Neuralink's live postings interview for Fall 2026 only.
  if (item.company === "Neuralink") {
    title = title
      .replace(/\s*[—–-]\s*Summer\s+2027\b/gi, "")
      .replace(/\s+Summer\s+2027\b/gi, "")
      .trim();
    if (!/fall\s*2026/i.test(title)) {
      title = `${title} — Fall 2026`;
    }
    if (!/\bUS\b|\bUnited States\b/i.test(title)) {
      title = `${title} (US)`;
    }
    if (!/fall\s*2026/i.test(description)) {
      description = `${description} (Fall 2026)`;
    }
    if (!/\bUS\b|\bUnited States\b/i.test(description)) {
      description = `${description} · US only`;
    }
    return { ...item, title, description };
  }

  if (!/summer\s*2027/i.test(title)) {
    title = `${title} — Summer 2027`;
  }
  if (!/\bUS\b|\bUnited States\b/i.test(title)) {
    title = `${title} (US)`;
  }
  if (!/summer\s*2027/i.test(description)) {
    description = `${description} (Summer 2027)`;
  }
  if (!/\bUS\b|\bUnited States\b/i.test(description)) {
    description = `${description} · US only`;
  }

  return { ...item, title, description };
}

export const INTERNSHIP_CATALOG: InternshipCatalogItem[] =
  RAW_CATALOG.map(withSeasonLabel);
