import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// Crawlers that fetch content to answer questions rather than to rank
// pages — the actual audience for the /*.md alternates (app/md/[slug]) and
// llms.txt. Given their own block so they can read the markdown twins,
// while generic search bots stay blocked from indexing what would
// otherwise look like duplicate content of the canonical HTML page.
const aiCrawlers = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/*.md",
        other: {
          // https://contentsignals.org — search=yes keeps normal indexing
          // on; ai-input=yes permits RAG/grounding use (the point of
          // llms.txt existing at all); ai-train=no withholds the separate
          // permission to reuse this content for model training.
          "Content-Signal": "search=yes, ai-input=yes, ai-train=no",
        },
      },
      { userAgent: aiCrawlers, allow: "/" },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
