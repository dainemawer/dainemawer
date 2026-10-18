/**
 * Internal-link and on-page audit for content/posts. Prints a Markdown
 * report: inbound/outbound internal links per post, orphans, the best
 * unlinked candidates (shared topics, no link either way), and frontmatter
 * that is too long or too short for search snippets.
 *
 *   pnpm --filter blog audit:links
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = join(process.cwd(), "content/posts");
const LINK =
  /\]\((?:https?:\/\/(?:www\.)?dainemawer\.com)?\/([a-z0-9-]+)\/?(?:#[^)]*)?\)/g;

type Entry = {
  slug: string;
  title: string;
  dek: string;
  date: string;
  topics: string[];
  outbound: Set<string>;
  inbound: Set<string>;
};

const entries = new Map<string, Entry>();

for (const file of readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"))) {
  const slug = file.replace(/\.mdx$/, "");
  const { data, content } = matter(
    readFileSync(join(CONTENT_DIR, file), "utf-8"),
  );
  entries.set(slug, {
    slug,
    title: data.title,
    dek: data.dek ?? "",
    date: data.date,
    topics: data.topics ?? [],
    outbound: new Set([...content.matchAll(LINK)].map((m) => m[1])),
    inbound: new Set(),
  });
}

for (const entry of entries.values()) {
  for (const target of entry.outbound)
    entries.get(target)?.inbound.add(entry.slug);
}

const posts = [...entries.values()].toSorted((a, b) =>
  a.date < b.date ? 1 : -1,
);
const internal = (e: Entry) => [...e.outbound].filter((s) => entries.has(s));
const shared = (a: Entry, b: Entry) =>
  a.topics.filter((t) => b.topics.includes(t));

const out: string[] = [
  "## Internal links",
  "",
  "| Post | Date | In | Out |",
  "| --- | --- | --: | --: |",
];
for (const p of posts)
  out.push(
    `| ${p.slug} | ${p.date} | ${p.inbound.size} | ${internal(p).length} |`,
  );

const orphans = posts.filter((p) => p.inbound.size === 0);
out.push(
  "",
  `## Orphans (no inbound links from other posts): ${orphans.length}`,
  "",
);
for (const p of orphans) out.push(`- ${p.slug}`);

out.push(
  "",
  "## Unlinked related pairs (share a topic, no link either way)",
  "",
);
for (const p of posts) {
  const candidates = posts
    .filter(
      (o) => o !== p && !p.outbound.has(o.slug) && !o.outbound.has(p.slug),
    )
    .map((o) => ({ o, topics: shared(p, o) }))
    .filter(({ topics }) => topics.length > 0)
    .toSorted((a, b) => b.topics.length - a.topics.length)
    .slice(0, 3);
  if (candidates.length === 0) continue;
  out.push(
    `- **${p.slug}** → ${candidates.map(({ o, topics }) => `${o.slug} (${topics.join(", ")})`).join("; ")}`,
  );
}

out.push(
  "",
  "## Snippet lengths",
  "",
  "Titles over 60 or deks outside 70–160 characters get truncated or rewritten in results.",
  "",
);
for (const p of posts) {
  const issues: string[] = [];
  if (p.title.length > 60) issues.push(`title ${p.title.length} chars`);
  if (p.dek.length < 70 || p.dek.length > 160)
    issues.push(`dek ${p.dek.length} chars`);
  if (issues.length > 0) out.push(`- ${p.slug}: ${issues.join(", ")}`);
}

console.log(out.join("\n"));
