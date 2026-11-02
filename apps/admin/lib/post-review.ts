import matter from "gray-matter";

// Pure parts of the blog post review (/reviews): which files in a pull
// request are posts, and what their frontmatter says. Tested in
// tests/post-review.test.ts. The GitHub calls live in lib/github.ts.

/** Where the blog keeps posts and TIL notes, from the repo root. */
const CONTENT = /^apps\/blog\/content\/(posts|til)\/([a-z0-9][a-z0-9-]*)\.mdx$/;

export type PostKind = "post" | "til";

export type PostFile = { path: string; kind: PostKind; slug: string };

/** A post or TIL file path, or null for anything else (post-ideas.md, code). */
export function postFile(path: string): PostFile | null {
  const match = CONTENT.exec(path);
  if (!match) return null;
  return {
    path,
    kind: match[1] === "til" ? "til" : "post",
    slug: match[2],
  };
}

/** The post files a pull request adds or changes. Removed ones aren't reviewable. */
export function postFiles(
  files: { filename: string; status: string }[],
): PostFile[] {
  return files.flatMap((file) => {
    if (file.status === "removed") return [];
    const post = postFile(file.filename);
    return post ? [post] : [];
  });
}

export type Frontmatter = {
  title: string;
  dek: string | null;
  date: string | null;
  topics: string[];
  shortAnswer: string | null;
  takeaways: string[];
  faq: { question: string; answer: string }[];
};

export type ParsedPost = {
  frontmatter: Frontmatter;
  body: string;
  wordCount: number;
  /** Matches the blog's lib/posts.ts: 200 words a minute, at least one. */
  readMinutes: number;
};

const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const texts = (value: unknown) =>
  Array.isArray(value) ? value.flatMap((v) => text(v) ?? []) : [];

// gray-matter turns an unquoted YYYY-MM-DD into a Date.
const isoDate = (value: unknown) =>
  value instanceof Date ? value.toISOString().slice(0, 10) : text(value);

/**
 * Splits a post into its frontmatter and MDX body. Lenient on purpose: a
 * missing field shows as missing on the review page instead of failing it,
 * because spotting that is part of the review.
 */
export function parsePost(source: string, fallbackTitle: string): ParsedPost {
  const { data, content } = matter(source);
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const faq = Array.isArray(data.faq)
    ? data.faq.flatMap((item: unknown) => {
        if (!item || typeof item !== "object") return [];
        const { question, answer } = item as Record<string, unknown>;
        const q = text(question);
        const a = text(answer);
        return q && a ? [{ question: q, answer: a }] : [];
      })
    : [];
  return {
    frontmatter: {
      title: text(data.title) ?? fallbackTitle,
      dek: text(data.dek),
      date: isoDate(data.date),
      topics: texts(data.topics ?? data.tags),
      shortAnswer: text(data.shortAnswer),
      takeaways: texts(data.takeaways),
      faq,
    },
    body: content,
    wordCount: words,
    readMinutes: Math.max(1, Math.round(words / 200)),
  };
}

/** The live URL a post will have once merged. */
export function liveUrl(file: PostFile) {
  return file.kind === "til"
    ? `https://www.dainemawer.com/til/${file.slug}`
    : `https://www.dainemawer.com/${file.slug}`;
}

export type CheckState = "passing" | "pending" | "failing" | "none";

/**
 * One verdict from a commit's check runs and commit statuses (Vercel posts
 * the latter): any failure fails, then anything unfinished is pending.
 */
export function checkState(
  runs: { status: string; conclusion: string | null }[],
  statuses: { state: string }[],
): CheckState {
  if (!runs.length && !statuses.length) return "none";
  const failed = new Set([
    "failure",
    "timed_out",
    "cancelled",
    "action_required",
    "startup_failure",
  ]);
  if (
    runs.some((r) => r.conclusion && failed.has(r.conclusion)) ||
    statuses.some((s) => s.state === "failure" || s.state === "error")
  ) {
    return "failing";
  }
  if (
    runs.some((r) => r.status !== "completed") ||
    statuses.some((s) => s.state === "pending")
  ) {
    return "pending";
  }
  return "passing";
}
