import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { cache } from "react";

// A TIL is a short note, not an article: the frontmatter is just a title, a
// date and optional tags. None of the article furniture (dek, short answer,
// takeaways, FAQ) applies, which is what keeps writing one cheap.
export type Til = {
  slug: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  tags: string[];
};

export type TilContent = {
  rawBody: string;
};

export const TIL_DESCRIPTION =
  "Short notes on things I learned this week — a problem, and the fix.";

const CONTENT_DIR = join(process.cwd(), "content/til");

// Re-read on every call rather than cached at module scope, for the same
// reason as lib/posts.ts: content/til isn't in the module graph, so a
// module-scope cache would never see an edit without a dev server restart.
function loadTils(): Til[] {
  return readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const { data } = matter(readFileSync(join(CONTENT_DIR, file), "utf-8"));
      return {
        slug,
        title: data.title as string,
        date: data.date as string,
        tags: (data.tags as string[]) ?? [],
      };
    })
    .toSorted((a, b) => (a.date < b.date ? 1 : -1));
}

export const getAllTils = cache((): Til[] => loadTils());

export const getTilBySlug = cache((slug: string): Til | undefined =>
  loadTils().find((til) => til.slug === slug),
);

export function getTilContent(slug: string): TilContent | undefined {
  let source: string;
  try {
    source = readFileSync(join(CONTENT_DIR, `${slug}.mdx`), "utf-8");
  } catch {
    return undefined;
  }
  return { rawBody: matter(source).content };
}

/** Entries bucketed by year, newest year first — the shape the index renders. */
export function groupTilsByYear(tils: Til[]): { year: number; tils: Til[] }[] {
  const byYear = new Map<number, Til[]>();
  for (const til of tils) {
    const year = new Date(til.date).getUTCFullYear();
    byYear.set(year, [...(byYear.get(year) ?? []), til]);
  }
  return Array.from(byYear, ([year, entries]) => ({
    year,
    tils: entries,
  })).toSorted((a, b) => b.year - a.year);
}
