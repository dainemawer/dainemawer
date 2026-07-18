export interface Project {
  slug: string;
  title: string;
  year: number;
  tags: string[];
  description: string;
  url: string;
  client: string;
  timeframe: string;
  problem: string;
  solution: string;
  gallery: { label: string }[];
}

export const projects: Project[] = [
  {
    slug: "monocle",
    title: "Monocle",
    year: 2025,
    tags: ["Full Stack", "Redesign"],
    description: "Complete redesign and rebuild of Monocle's platform.",
    url: "https://monocle.com",
    client: "Monocle",
    timeframe: "3 months",
    problem:
      "Monocle's existing platform was built on a legacy stack that couldn't keep pace with editorial demands — page loads were slow, the CMS made publishing painful, and the design no longer reflected the brand.",
    solution:
      "Rebuilt the platform end-to-end on Next.js with a modern headless CMS, cutting load times significantly and giving the editorial team a publishing workflow that matches how they actually work. Design and engineering were handled together to ship a cohesive, fast, on-brand experience.",
    gallery: [
      { label: "Homepage" },
      { label: "Article Page" },
      { label: "Mobile Breakpoints" },
    ],
  },
  {
    slug: "ayala-land-hospitality",
    title: "Ayala Land Hospitality",
    year: 2025,
    tags: ["Next.js", "Sanity"],
    description:
      "Multi-brand hotel booking platform across Ayala Land's hospitality group.",
    url: "https://example.com/work/ayala-land-hospitality",
    client: "Ayala Land Hospitality",
    timeframe: "4 months",
    problem:
      "Ayala Land's hospitality group spans multiple hotel brands, each previously running on its own disconnected booking system — inconsistent UX, duplicated engineering effort, and no shared component library.",
    solution:
      "Designed and built a single Next.js platform with Sanity-managed content that powers every brand from one codebase, with brand-specific theming and a unified booking flow. Cut time-to-launch for new properties from months to weeks.",
    gallery: [
      { label: "Homepage" },
      { label: "Booking Flow" },
      { label: "Mobile Breakpoints" },
    ],
  },
  {
    slug: "hello-magazine",
    title: "Hello Magazine",
    year: 2023,
    tags: ["Next.js", "Headless CMS"],
    description:
      "Editorial platform rebuild for one of the world's largest celebrity/lifestyle publishers.",
    url: "https://example.com/work/hello-magazine",
    client: "Hello Magazine",
    timeframe: "5 months",
    problem:
      "One of the world's largest celebrity and lifestyle publishers needed to move off a legacy CMS that couldn't handle their publishing volume or editorial ambitions.",
    solution:
      "Rebuilt the editorial platform on Next.js with a headless CMS, giving editors a faster publishing workflow and readers a significantly faster site, without interrupting the newsroom's day-to-day output during the migration.",
    gallery: [
      { label: "Homepage" },
      { label: "Article Page" },
      { label: "Mobile Breakpoints" },
    ],
  },
  {
    slug: "boston-com",
    title: "Boston.com",
    year: 2022,
    tags: ["Rebuild", "Performance"],
    description:
      "Full platform rebuild for one of the US's oldest news mastheads.",
    url: "https://example.com/work/boston-com",
    client: "Boston.com",
    timeframe: "6 months",
    problem:
      "One of the US's oldest news mastheads was running on an aging platform that struggled under traffic spikes and dragged down Core Web Vitals, hurting both readers and ad revenue.",
    solution:
      'Led a full platform rebuild focused on performance — restructuring rendering strategy, trimming bundle size, and rearchitecting the ad-loading pipeline — bringing the site comfortably within "Good" Core Web Vitals thresholds at scale.',
    gallery: [
      { label: "Homepage" },
      { label: "Article Page" },
      { label: "Mobile Breakpoints" },
    ],
  },
  {
    slug: "nobel-peace-prize",
    title: "Nobel Peace Prize",
    year: 2020,
    tags: ["Rebuild"],
    description: "Rebuild of the official Nobel Peace Prize website.",
    url: "https://example.com/work/nobel-peace-prize",
    client: "The Nobel Peace Prize",
    timeframe: "3 months",
    problem:
      "The official Nobel Peace Prize website needed a rebuild that could honor the gravity of the institution while being maintainable by a small editorial team.",
    solution:
      "Rebuilt the site with a clean, accessible, content-first design and a CMS-driven structure that lets the Nobel team publish laureate and ceremony content independently, without engineering support.",
    gallery: [
      { label: "Homepage" },
      { label: "Laureate Page" },
      { label: "Mobile Breakpoints" },
    ],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
