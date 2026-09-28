import type { Metadata } from "next";
import { HomeIndex } from "@/components/home-index";
import { pagePath, paginate } from "@/lib/pagination";
import { getAllPosts } from "@/lib/posts";

// Title, description and canonical come from the root layout; page 1 only
// adds the link to page 2. A year view has no next page — it's one page.
export async function generateMetadata(
  props: PageProps<"/">,
): Promise<Metadata> {
  const { year } = await props.searchParams;
  const slice = paginate(getAllPosts(), 1);
  if (year || !slice || slice.totalPages < 2) return {};
  return { pagination: { next: pagePath("/", 2) } };
}

export default async function HomePage(props: PageProps<"/">) {
  const { year } = await props.searchParams;
  const selectedYear = typeof year === "string" ? Number(year) : undefined;

  if (selectedYear) {
    const posts = getAllPosts().filter(
      (post) => new Date(post.date).getFullYear() === selectedYear,
    );
    return (
      <HomeIndex
        slice={{ items: posts, page: 1, totalPages: 1, offset: 0 }}
        selectedYear={selectedYear}
      />
    );
  }

  // Page 1 always exists, even with no posts at all.
  const slice = paginate(getAllPosts(), 1);
  return (
    <HomeIndex
      slice={slice ?? { items: [], page: 1, totalPages: 1, offset: 0 }}
    />
  );
}
