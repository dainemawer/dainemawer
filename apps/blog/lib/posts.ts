import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { cache } from "react";

export type Post = {
  slug: string;
  title: string;
  dek: string;
  date: string; // ISO yyyy-mm-dd
  updated?: string;
  readTime: string;
  wordCount: number;
  topics: string[]; // topic slugs
};

const CONTENT_DIR = join(process.cwd(), "content/posts");
const WORDS_PER_MINUTE = 200;

function countWords(body: string): number {
  return body.trim().split(/\s+/).filter(Boolean).length;
}

function readTimeFor(words: number): string {
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

function loadPosts(): Post[] {
  return readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const source = readFileSync(join(CONTENT_DIR, file), "utf-8");
      const { data, content } = matter(source);
      const words = countWords(content);
      return {
        slug,
        title: data.title as string,
        dek: data.dek as string,
        date: data.date as string,
        updated: data.updated as string | undefined,
        readTime: readTimeFor(words),
        wordCount: words,
        topics: (data.topics as string[]) ?? [],
      };
    });
}

// Re-read on every call rather than caching at module scope: this is a
// small directory of files, so the fs cost is negligible, and it means
// editing a post's frontmatter shows up on the next request instead of
// needing a dev server restart (content/posts isn't part of the module
// graph, so Turbopack/webpack have no way to invalidate a module-scope
// cache when a file in it changes).
function getSortedPosts(): Post[] {
  return loadPosts().toSorted((a, b) => (a.date < b.date ? 1 : -1));
}

export const getAllPosts = cache((): Post[] => getSortedPosts());

export const getPostBySlug = cache((slug: string): Post | undefined =>
  getSortedPosts().find((post) => post.slug === slug),
);

export function getPostsByTopic(topic: string): Post[] {
  return getSortedPosts().filter((post) => post.topics.includes(topic));
}

export function getYears(): number[] {
  const years = new Set(
    getSortedPosts().map((post) => new Date(post.date).getFullYear()),
  );
  return Array.from(years).toSorted((a, b) => b - a);
}
