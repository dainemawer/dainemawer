import { readFileSync } from "node:fs";
import { join } from "node:path";
import GithubSlugger from "github-slugger";
import matter from "gray-matter";

const CONTENT_DIR = join(process.cwd(), "content/posts");

export type TocItem = { id: string; label: string };

export type PostContent = {
  shortAnswer: string;
  takeaways: string[];
  faq: { question: string; answer: string }[];
  related?: { label: string; href: string };
  prev?: { label: string; href: string };
  next?: { label: string; href: string };
  toc: TocItem[];
  rawBody: string;
  needsRewrite: boolean;
};

// Mirrors the heading IDs rehype-slug assigns when the body is compiled
// for render (same underlying `github-slugger`), so the hand-scanned TOC
// list and the actual rendered anchor targets always agree.
function extractToc(rawBody: string): TocItem[] {
  const slugger = new GithubSlugger();
  return [...rawBody.matchAll(/^##\s+(.+)$/gm)].map(([, heading]) => {
    const label = heading.replace(/[*_`]/g, "").trim();
    return { id: slugger.slug(label), label };
  });
}

export function getPostContent(slug: string): PostContent | undefined {
  let source: string;
  try {
    source = readFileSync(join(CONTENT_DIR, `${slug}.mdx`), "utf-8");
  } catch {
    return undefined;
  }
  const { data, content } = matter(source);

  return {
    shortAnswer: (data.shortAnswer as string) ?? "",
    takeaways: (data.takeaways as string[]) ?? [],
    faq: (data.faq as PostContent["faq"]) ?? [],
    related: data.related,
    prev: data.prev,
    next: data.next,
    toc: extractToc(content),
    rawBody: content,
    needsRewrite: Boolean(data.needsRewrite),
  };
}
