export interface Service {
  index: string;
  title: string;
  stack: string[];
  pitch: string;
  engagement: "Project" | "Sprint" | "Retainer";
}

export const services: Service[] = [
  {
    index: "01",
    title: "Custom Software & MVP Development",
    stack: ["Next.js", "TypeScript", "Supabase"],
    pitch:
      "Turn your idea into production-ready software in weeks, not months — a full-stack build tailored to your business, not a template.",
    engagement: "Project",
  },
  {
    index: "02",
    title: "AI Agents & Automation",
    stack: ["OpenAI", "Vercel AI SDK"],
    pitch:
      "I design and build AI agents that handle real workflows — support, ops, internal tooling — so your team stops doing it by hand.",
    engagement: "Sprint",
  },
  {
    index: "03",
    title: "Performance & Cost Optimization",
    stack: ["Core Web Vitals", "Lighthouse CI"],
    pitch:
      "Slow and expensive to run? I audit and rebuild for speed and lower infra cost — 40% faster loads, 30% smaller bundles, proven at enterprise scale.",
    engagement: "Sprint",
  },
  {
    index: "04",
    title: "Legacy Modernization & Migration",
    stack: ["Next.js", "TypeScript"],
    pitch:
      "Move off an outdated stack onto a modern, maintainable foundation — without paying for a rebuild from scratch.",
    engagement: "Project",
  },
  {
    index: "05",
    title: "Fractional Staff Engineering",
    stack: ["Architecture", "Mentorship"],
    pitch:
      "Embedded, staff-level technical leadership for teams that need senior direction without a full-time hire.",
    engagement: "Retainer",
  },
];
