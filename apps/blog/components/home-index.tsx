import type { CSSProperties } from "react";
import { ViewTransition } from "react";
import { DirectionalTransition } from "@/components/directional-transition";
import { JsonLd } from "@/components/json-ld";
import { PageShell } from "@/components/page-shell";
import { Pagination } from "@/components/pagination";
import { PostListItem } from "@/components/post-list-item";
import { YearFilter } from "@/components/year-filter";
import type { PageSlice } from "@/lib/pagination";
import { pagePath } from "@/lib/pagination";
import type { Post } from "@/lib/posts";
import { collectionPageSchema } from "@/lib/schema";
import { site } from "@/lib/site";

/**
 * The homepage article list, shared by `/` and `/page/[page]`. A year
 * filter shows that whole year on one page — a bounded archive, and a
 * query-string view whose canonical is already `/` — so pagination only
 * applies to the unfiltered list.
 */
export function HomeIndex({
  slice,
  selectedYear,
}: {
  slice: PageSlice<Post>;
  selectedYear?: number;
}) {
  const { items: posts, page, totalPages, offset } = slice;
  const path = pagePath("/", page);

  return (
    <DirectionalTransition vtKey={`home-${page}`}>
      <PageShell
        sidebar={<YearFilter selected={selectedYear} />}
        sidebarGap="md:gap-14"
      >
        {!selectedYear && (
          <JsonLd
            schema={collectionPageSchema({
              path,
              name: page === 1 ? site.name : `${site.name} — page ${page}`,
              description: site.description,
              posts,
              offset,
            })}
          />
        )}
        <h1 className="sr-only">
          {page === 1 ? "Writing" : `Writing — page ${page} of ${totalPages}`}
        </h1>
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
        {!selectedYear && (
          <div className="mt-14">
            <Pagination basePath="/" page={page} totalPages={totalPages} />
          </div>
        )}
      </PageShell>
    </DirectionalTransition>
  );
}
