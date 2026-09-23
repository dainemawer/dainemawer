import type { Post } from "./posts";

export type SearchGroup = "Articles" | "Pages" | "Machine";

export type SearchEntry = {
  /** Stable, unique — used for the option id `aria-activedescendant` points at. */
  id: string;
  group: SearchGroup;
  label: string;
  description: string;
  href: string;
  /** Right-hand column: a date for articles, the path for everything else. */
  meta: string;
  /**
   * True for anything that isn't a React route — the feeds, llms.txt and the
   * markdown twins are all route handlers, so `router.push` has nothing to
   * navigate to and they need a real document load.
   */
  external: boolean;
};

// Rendered in this order, and the arrow keys walk them in this order too.
// Machine sits last deliberately: it's the group a human reaching for ⌘K is
// least likely to want, so it shouldn't push articles down the list.
export const SEARCH_GROUPS: SearchGroup[] = ["Articles", "Pages", "Machine"];

const pages: Omit<SearchEntry, "group" | "external">[] = [
  {
    id: "page-about",
    label: "About",
    description: "Work, clients, speaking, and how to verify any of it.",
    href: "/about",
    meta: "/about",
  },
  {
    id: "page-contact",
    label: "Contact",
    description: "Speaking, a post, a correction, or something else.",
    href: "/contact",
    meta: "/contact",
  },
  {
    id: "page-uses",
    label: "Uses",
    description: "The desk, the editor, and what's actually running on it.",
    href: "/uses",
    meta: "/uses",
  },
  {
    id: "page-now",
    label: "Now",
    description: "What's got my attention at the moment.",
    href: "/now",
    meta: "/now",
  },
  {
    id: "page-privacy",
    label: "Privacy",
    description: "What this site collects, and why.",
    href: "/privacy",
    meta: "/privacy",
  },
];

const machine: {
  id: string;
  label: string;
  description: string;
  href: string;
  external: boolean;
}[] = [
  {
    id: "machine-agents",
    label: "Agents",
    description: "When to use this site, and every endpoint on it.",
    href: "/agents",
    // The only real page in this group, so it stays a client-side route.
    external: false,
  },
  {
    id: "machine-llms",
    label: "llms.txt",
    description: "Structured index of every article, topic and feed.",
    href: "/llms.txt",
    external: true,
  },
  {
    id: "machine-llms-full",
    label: "llms-full.txt",
    description: "The index plus the full text of every article.",
    href: "/llms-full.txt",
    external: true,
  },
  {
    id: "machine-index-md",
    label: "index.md",
    description: "The homepage article index, as Markdown.",
    href: "/index.md",
    external: true,
  },
  {
    id: "machine-rss",
    label: "RSS",
    description: "New articles, as an RSS feed.",
    href: "/rss.xml",
    external: true,
  },
  {
    id: "machine-json-feed",
    label: "JSON Feed",
    description: "New articles, as a JSON feed.",
    href: "/feed.json",
    external: true,
  },
  {
    id: "machine-sitemap",
    label: "Sitemap",
    description: "Every canonical URL, with last-modified dates.",
    href: "/sitemap.xml",
    external: true,
  },
];

/**
 * One flat, ordered list of everything the palette can reach. Flat rather
 * than nested by group so the cursor stays a single index and the arrow keys
 * cross group boundaries without any special casing; the renderer slices it
 * back into groups for display.
 */
export function buildSearchEntries(
  posts: Post[],
  formatDate: (date: string) => string,
): SearchEntry[] {
  return [
    ...posts.map((post) => ({
      id: `article-${post.slug}`,
      group: "Articles" as const,
      label: post.title,
      description: post.dek,
      href: `/${post.slug}`,
      meta: formatDate(post.date),
      external: false,
    })),
    ...pages.map((page) => ({
      ...page,
      group: "Pages" as const,
      external: false,
    })),
    ...machine.map((item) => ({
      ...item,
      group: "Machine" as const,
      meta: item.href,
    })),
  ];
}

export function filterSearchEntries(
  entries: SearchEntry[],
  query: string,
): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter((entry) =>
    `${entry.label} ${entry.description} ${entry.href}`
      .toLowerCase()
      .includes(q),
  );
}
