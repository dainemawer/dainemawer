export type Topic = {
  slug: string;
  name: string;
  dek: string;
};

export const topics: Topic[] = [
  {
    slug: "performance",
    name: "Web Performance",
    dek: "Measuring what users actually feel, and cutting what they never needed.",
  },
  {
    slug: "javascript",
    name: "JavaScript",
    dek: "Browser APIs, event handling, observers, framework-agnostic patterns.",
  },
  {
    slug: "css",
    name: "CSS",
    dek: "Custom properties, positioning, Baseline and interoperability.",
  },
  {
    slug: "engineering-management",
    name: "Engineering Management",
    dek: "Estimation, scoping, team process.",
  },
  {
    slug: "staff-engineering",
    name: "Staff Engineering",
    dek: "Technical direction, cross-team leverage, the work beyond a single codebase.",
  },
  {
    slug: "ai",
    name: "AI",
    dek: "Agentic coding, review practices, and how AI is reshaping the day-to-day of building software.",
  },
];

export function getTopicBySlug(slug: string): Topic | undefined {
  return topics.find((topic) => topic.slug === slug);
}
