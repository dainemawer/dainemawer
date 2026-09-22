export const site = {
  name: "Daine Mawer",
  logo: "D-M",
  role: "Staff Engineer, Web Applications",
  company: { name: "Fueled", url: "https://www.fueled.com" },
  location: "Cape Town, South Africa",
  // The structured form of `location`, for schema.org PostalAddress.
  // City-level and deliberately so: this site is published by an individual
  // rather than a registered company with premises, so there is no business
  // street address to give, and a home address has no business sitting in a
  // document every crawler and LLM ingests. PostalAddress has no required
  // properties — locality/region/country is a complete node without one.
  address: {
    locality: "Cape Town",
    region: "Western Cape",
    country: "ZA",
  },
  tagline: "Staff Engineer, Web Applications at Fueled, Cape Town",
  url: "https://www.dainemawer.com",
  email: "hello@dainemawer.com",
  social: {
    github: "https://github.com/dainemawer",
    linkedin: "https://www.linkedin.com/in/dainemawer",
    bluesky: "https://bsky.app/profile/dainemawer.com",
  },
} as const;

export const footerNav = [
  {
    heading: "Site",
    links: [
      { label: "Writing", href: "/about#writing" },
      { label: "Speaking", href: "/about#speaking" },
      { label: "About", href: "/about" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
  {
    heading: "Elsewhere",
    links: [
      { label: "GitHub", href: site.social.github },
      { label: "LinkedIn", href: site.social.linkedin },
      { label: "Bluesky", href: site.social.bluesky },
    ],
  },
  {
    heading: "Feeds",
    links: [
      { label: "RSS", href: "/rss.xml" },
      { label: "JSON Feed", href: "/feed.json" },
      { label: "Sitemap", href: "/sitemap.xml" },
    ],
  },
  {
    heading: "Machine",
    links: [
      { label: "Agents", href: "/agents" },
      { label: "llms.txt", href: "/llms.txt" },
      { label: "Uses", href: "/uses" },
      { label: "Now", href: "/now" },
    ],
  },
] as const;
