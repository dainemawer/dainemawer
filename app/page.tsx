import type { CSSProperties } from "react";
import { ViewTransition } from "react";
import { DirectionalTransition } from "@/components/directional-transition";
import { PageShell } from "@/components/page-shell";
import { PostListItem } from "@/components/post-list-item";
import { YearFilter } from "@/components/year-filter";
import { getAllPosts } from "@/lib/posts";

export default async function HomePage(props: PageProps<"/">) {
  const { year } = await props.searchParams;
  const selectedYear = typeof year === "string" ? Number(year) : undefined;

  const posts = getAllPosts().filter(
    (post) =>
      !selectedYear || new Date(post.date).getFullYear() === selectedYear,
  );

  return (
    <DirectionalTransition>
      <PageShell
        sidebar={<YearFilter selected={selectedYear} />}
        sidebarGap="md:gap-14"
      >
        <h1 className="sr-only">Writing</h1>
        <ul className="flex flex-col gap-8.5">
          {posts.map((post, index) => (
            <ViewTransition key={post.slug}>
              <li
                className="stagger-in"
                style={
                  { "--stagger-index": Math.min(index, 12) } as CSSProperties
                }
              >
                <PostListItem post={post} />
              </li>
            </ViewTransition>
          ))}
        </ul>
      </PageShell>
    </DirectionalTransition>
  );
}
