// Shared by the homepage, the topic indexes, their Markdown twins and the
// sitemap, so the page size and the URL shape can't drift between them.
export const POSTS_PER_PAGE = 10;

export type PageSlice<T> = {
  items: T[];
  page: number;
  totalPages: number;
  /** Index of `items[0]` in the full list — ItemList positions continue across pages. */
  offset: number;
};

export function countPages(total: number, perPage = POSTS_PER_PAGE): number {
  return Math.max(1, Math.ceil(total / perPage));
}

/**
 * A `[page]` route segment as a page number, or undefined when it isn't one.
 * Strict on purpose: `02`, `2.0` and `+2` would otherwise be duplicate URLs
 * for page 2, so they 404 rather than render.
 */
export function parsePageParam(value: string): number | undefined {
  if (!/^[1-9]\d*$/.test(value)) return undefined;
  return Number(value);
}

/** The requested page of `items`, or undefined when it's past the end. */
export function paginate<T>(
  items: T[],
  page: number,
  perPage = POSTS_PER_PAGE,
): PageSlice<T> | undefined {
  const totalPages = countPages(items.length, perPage);
  if (!Number.isInteger(page) || page < 1 || page > totalPages) {
    return undefined;
  }
  const offset = (page - 1) * perPage;
  return {
    items: items.slice(offset, offset + perPage),
    page,
    totalPages,
    offset,
  };
}

/**
 * Site path for page `page` of the listing rooted at `base`. Page 1 is the
 * listing itself — `/page/1` redirects there (next.config.ts) — so it never
 * exists twice.
 */
export function pagePath(base: string, page: number): string {
  if (page <= 1) return base;
  return `${base === "/" ? "" : base}/page/${page}`;
}

/** Page numbers 2…N — what generateStaticParams and the sitemap enumerate. */
export function laterPages(total: number, perPage = POSTS_PER_PAGE): number[] {
  return Array.from(
    { length: countPages(total, perPage) - 1 },
    (_, index) => index + 2,
  );
}

// Two gaps at most — one each side of the current page — so each is
// named for its side, which also makes it a stable React key.
export type PageRangeItem = number | "gap-start" | "gap-end";

/**
 * The numbered links to render: always the first and last page, plus the
 * current page and its neighbours, with a gap wherever pages are skipped.
 * A gap that would hide exactly one page shows that page instead — an
 * ellipsis standing in for a single number saves nothing.
 */
export function pageRange(
  current: number,
  totalPages: number,
): PageRangeItem[] {
  const shown = new Set([1, totalPages, current - 1, current, current + 1]);
  const pages = [...shown]
    .filter((page) => page >= 1 && page <= totalPages)
    .toSorted((a, b) => a - b);

  const range: PageRangeItem[] = [];
  let previous = 0;
  for (const page of pages) {
    if (page - previous === 2) range.push(previous + 1);
    else if (page - previous > 2) {
      range.push(page <= current ? "gap-start" : "gap-end");
    }
    range.push(page);
    previous = page;
  }
  return range;
}
