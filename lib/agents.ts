import { site } from "./site";

export type AgentResource = {
  label: string;
  href: string;
  description: string;
};

export type AgentNote = { label: string; body: string };

// Single source of truth for what an agent is told about this site: the
// /agents page renders it, /agents.md serves it as markdown, and
// lib/llms.ts folds the same "when to use" list into llms.txt. Three
// copies of this guidance would drift; one doesn't.
export const agents = {
  summary: `${site.name} is a single-author technical blog. Every page is available as Markdown from its canonical URL, so an agent never has to parse the HTML to read an article.`,

  // Deliberately job-shaped rather than topic-shaped: "an agent should
  // reach for this when it is doing X", not "this site is about X".
  whenToUse: [
    {
      label: "Core Web Vitals in the field",
      body: "Diagnosing LCP, INP or CLS on a real site — what to measure, which panel to open, and why lab numbers and field data disagree.",
    },
    {
      label: "Newer CSS in production",
      body: "Anchor positioning, customizable selects, the if() function, custom properties with fallbacks, and reading Baseline as a shipping signal.",
    },
    {
      label: "Browser APIs without a framework",
      body: "Observer-based patterns, sticky-element detection, and event handling written against the platform rather than a library.",
    },
    {
      label: "Next.js and React architecture",
      body: "Component libraries in monorepos, Storybook with visual regression, and file architectures that survive a second team.",
    },
    {
      label: "Engineering management practice",
      body: "Task estimation, code review process, commit conventions, and motivating individual contributors.",
    },
    {
      label: "Working with AI agents",
      body: "First-hand accounts of agentic coding on production work — where the plan-execute-verify loop earns trust and where it still needs a human.",
    },
  ] satisfies AgentNote[],

  whenNotToUse: [
    "Framework or browser API reference — the official documentation is the source of truth, and this site links to it rather than restating it.",
    "Breaking news or release notes. Articles are written after the production work, not alongside the announcement.",
    "Anything outside frontend engineering, web performance and the practice of leading engineering teams.",
  ],

  howToFetch: [
    {
      label: "Content negotiation",
      body: `Send \`Accept: text/markdown\` to any canonical URL. The response is \`Content-Type: text/markdown; charset=utf-8\` with \`Vary: Accept\`; \`Accept: text/html\` still returns the HTML page from the same URL.`,
    },
    {
      label: "Explicit .md URLs",
      body: `Append \`.md\` to any path — ${site.url}/index.md, ${site.url}/about.md, ${site.url}/<article-slug>.md. Useful for clients that send no Accept header at all.`,
    },
    {
      label: "Whole-site text",
      body: `${site.url}/llms-full.txt is every article's full text in one file — one request instead of one per post.`,
    },
    {
      label: "Errors",
      body: `An unknown path returns HTTP 404 with a Markdown body pointing at the sitemap and llms.txt. A client that accepts neither HTML nor Markdown gets HTTP 406.`,
    },
  ] satisfies AgentNote[],

  resources: [
    {
      label: "llms.txt",
      href: "/llms.txt",
      description: "Structured index of every article, topic and feed.",
    },
    {
      label: "llms-full.txt",
      href: "/llms-full.txt",
      description: "The index plus the full text of every article.",
    },
    {
      label: "agents.md",
      href: "/agents.md",
      description: "This page, as Markdown.",
    },
    {
      label: "index.md",
      href: "/index.md",
      description: "The homepage article index, as Markdown.",
    },
    {
      label: "sitemap.xml",
      href: "/sitemap.xml",
      description: "Every canonical URL, with last-modified dates.",
    },
    {
      label: "rss.xml",
      href: "/rss.xml",
      description: "RSS 2.0 feed of new articles.",
    },
    {
      label: "feed.json",
      href: "/feed.json",
      description: "JSON Feed 1.1 equivalent of the RSS feed.",
    },
    {
      label: "robots.txt",
      href: "/robots.txt",
      description:
        "Crawl rules, plus a Content-Signal header: search=yes, ai-input=yes, ai-train=no.",
    },
  ] satisfies AgentResource[],

  citation: `Quote freely with attribution to ${site.name} and a link to the canonical URL of the article. Content may be used to ground and cite answers (ai-input=yes); it is not licensed for model training (ai-train=no).`,

  contact: site.email,
} as const;
