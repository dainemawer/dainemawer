import { Breadcrumb } from "@/components/breadcrumb";
import { DirectionalTransition } from "@/components/directional-transition";
import { JsonLd } from "@/components/json-ld";
import { MetaRow } from "@/components/meta-row";
import { PageShell } from "@/components/page-shell";
import { Pagination } from "@/components/pagination";
import { PostListItem } from "@/components/post-list-item";
import { TopicFilterNav } from "@/components/topic-filter-nav";
import type { PageSlice } from "@/lib/pagination";
import { pagePath } from "@/lib/pagination";
import type { Post } from "@/lib/posts";
import { collectionPageSchema } from "@/lib/schema";
import type { Topic } from "@/lib/topics";
import { topics } from "@/lib/topics";

/** A topic's article list, shared by `/topics/[topic]` and its later pages. */
export function TopicIndex({
  topic,
  slice,
  total,
}: {
  topic: Topic;
  slice: PageSlice<Post>;
  total: number;
}) {
  const { items: posts, page, totalPages, offset } = slice;
  const basePath = `/topics/${topic.slug}`;

  return (
    <DirectionalTransition vtKey={`${topic.slug}-${page}`}>
      <PageShell
        sidebar={<TopicFilterNav topics={topics} activeSlug={topic.slug} />}
      >
        <JsonLd
          schema={collectionPageSchema({
            path: pagePath(basePath, page),
            name:
              page === 1
                ? `${topic.name} articles`
                : `${topic.name} articles — page ${page}`,
            description: topic.dek,
            posts,
            offset,
          })}
        />
        <div className="mx-auto max-w-content">
          <Breadcrumb
            items={
              page === 1
                ? [{ label: "Home", href: "/" }, { label: "Topics" }]
                : [
                    { label: "Home", href: "/" },
                    { label: topic.name, href: basePath },
                    { label: `Page ${page}` },
                  ]
            }
          />

          <h1 className="mt-4.5 text-2xl text-ink tracking-tight">
            {topic.name}
          </h1>
          <div className="mt-2 text-md text-muted text-pretty">{topic.dek}</div>
          <div className="mt-5 flex items-baseline gap-x-2 text-sm text-muted">
            <span>
              {total} article{total === 1 ? "" : "s"}
            </span>
            {totalPages > 1 && (
              <>
                <span aria-hidden="true" className="text-faint">
                  ·
                </span>
                <span>
                  page {page} of {totalPages}
                </span>
              </>
            )}
          </div>

          <div className="mt-13 flex flex-col gap-11.5">
            <MetaRow label="Articles">
              {posts.length > 0 ? (
                <ul className="flex flex-col gap-7.5">
                  {posts.map((post) => (
                    <li key={post.slug}>
                      <PostListItem post={post} headingLevel="h3" />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-md text-faint">
                  No articles under this topic yet.
                </p>
              )}
            </MetaRow>
            <Pagination
              basePath={basePath}
              page={page}
              totalPages={totalPages}
            />
          </div>
        </div>
      </PageShell>
    </DirectionalTransition>
  );
}
