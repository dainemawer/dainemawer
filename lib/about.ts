export const about = {
  summary:
    "I'm a Staff Engineer, Web Applications, working across TypeScript, React Native, Expo and Next.js — mobile and web treated as one discipline rather than two teams. I write about the parts of the job that don't fit in a ticket: performance as a measurement discipline, architecture that survives a second team, and estimation that holds up in front of a client. Most of what I publish comes out of production work rather than side projects.",
  work: [
    {
      period: "2022 — now",
      description:
        "Staff Engineer, Web Applications. Leading frontend and React Native delivery across a distributed team — TypeScript, Next.js and Expo, spanning large-scale publishing, commerce and consumer mobile builds.",
    },
    {
      period: "2018 — 2022",
      description:
        "Senior Frontend Engineer. Performance and accessibility remediation on high-traffic WordPress and headless builds.",
    },
  ],
  clients: [
    "Uber",
    "Microsoft",
    "Nobel Peace Prize",
    "Monocle",
    "Boston Globe",
    "Good Housekeeping",
    "Intercom",
    "Sage",
    "Gtac",
    "Ayaland",
  ],
  speaking: [
    {
      venue: "WordCamp",
      topic: "Core Web Vitals for real sites, not lab scores.",
    },
    { venue: "Meetups", topic: "Estimation as a design constraint." },
  ],
  writesAbout: [
    { label: "Performance", href: "/topics/performance" },
    { label: "JavaScript", href: "/topics/javascript" },
    { label: "CSS", href: "/topics/css" },
    { label: "Engineering Management", href: "/topics/engineering-management" },
  ],
  verify: [
    { label: "GitHub", href: "https://github.com/dainemawer" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/dainemawer" },
    { label: "Bluesky", href: "https://bsky.app/profile/dainemawer.com" },
    { label: "hello@dainemawer.com", href: "mailto:hello@dainemawer.com" },
  ],
} as const;
