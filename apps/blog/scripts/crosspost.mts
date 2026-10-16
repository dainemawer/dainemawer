/**
 * Syndicates a post with its canonical URL pointing home, so search
 * engines credit dainemawer.com and not the copy.
 *
 *   pnpm --filter blog crosspost <slug>            # dev.to draft + paste file
 *   pnpm --filter blog crosspost <slug> --dry-run  # paste file only
 *
 * - dev.to: creates an unpublished draft via the API (DEVTO_API_KEY, from
 *   dev.to/settings/extensions). Review it there and hit publish.
 * - Hashnode / Medium: Hashnode's API needs a paid Pro plan since May
 *   2026, so this writes `.crosspost/<slug>.md` to paste instead. Set the
 *   canonical URL it prints in Hashnode's "originally published at" field,
 *   or use Medium's importer (medium.com/p/import), which sets it for you.
 *
 * Wait 3–7 days after the post goes live before publishing a copy, so the
 * original is indexed first.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { site } from "../lib/site";
import { utmUrl } from "../lib/utm";

// dev.to allows four lowercase alphanumeric tags; topic slugs map onto the
// tags those communities actually follow.
const DEVTO_TAGS: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  react: "react",
  "react-native": "reactnative",
  nextjs: "nextjs",
  css: "css",
  ai: "ai",
  "staff-engineering": "career",
  "engineering-management": "management",
  performance: "performance",
  security: "security",
};

const [slug, ...flags] = process.argv.slice(2);
const dryRun = flags.includes("--dry-run");

if (!slug) {
  console.error("Usage: pnpm --filter blog crosspost <slug> [--dry-run]");
  process.exit(1);
}

const { data, content } = matter(
  readFileSync(join(process.cwd(), "content/posts", `${slug}.mdx`), "utf-8"),
);
const canonical = `${site.url}/${slug}`;

// Root-relative links would point at dev.to/hashnode, so make them absolute.
const body = content.replace(
  /\]\((\/[^)\s]*)\)/g,
  (_, path) => `](${site.url}${path})`,
);

const markdownFor = (channel: "devto" | "hashnode") =>
  [
    data.shortAnswer ? `**TL;DR:** ${data.shortAnswer}\n` : "",
    body.trim(),
    "",
    "---",
    "",
    `*Originally published at [dainemawer.com](${canonical}). I write about React, React Native, TypeScript and engineering leadership a couple of times a week — [subscribe to the newsletter](${utmUrl("/", channel, { campaign: slug, content: "footer" })}) to get new posts.*`,
  ].join("\n");

// "webdev" is dev.to's most-followed tag, so it fills a spare slot.
const tags = [
  ...new Set([
    ...(data.topics as string[]).map((t) => DEVTO_TAGS[t]).filter(Boolean),
    "webdev",
  ]),
].slice(0, 4);

const outDir = join(process.cwd(), ".crosspost");
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, `${slug}.md`);
writeFileSync(
  outFile,
  `# ${data.title}\n\n> ${data.dek}\n\n${markdownFor("hashnode")}\n`,
);
console.log(`Paste-ready file: ${outFile}`);
console.log(`Canonical URL:    ${canonical}`);
console.log(
  `Tags:             ${tags.join(", ") || "(none mapped — add them by hand)"}`,
);

if (dryRun) process.exit(0);

const apiKey = process.env.DEVTO_API_KEY;
if (!apiKey) {
  console.error("DEVTO_API_KEY is not set — skipping the dev.to draft.");
  process.exit(1);
}

const response = await fetch("https://dev.to/api/articles", {
  method: "POST",
  headers: { "api-key": apiKey, "content-type": "application/json" },
  body: JSON.stringify({
    article: {
      title: data.title,
      body_markdown: markdownFor("devto"),
      published: false,
      canonical_url: canonical,
      description: data.dek,
      tags,
    },
  }),
});

if (!response.ok) {
  console.error(
    `dev.to rejected the draft: ${response.status} ${await response.text()}`,
  );
  process.exit(1);
}

const article = (await response.json()) as { url: string };
console.log(
  `dev.to draft:     ${article.url} (unpublished — review, then publish)`,
);
