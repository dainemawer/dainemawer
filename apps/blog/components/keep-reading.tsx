import { formatPostDate } from "@/lib/format";
import type { Post } from "@/lib/posts";
import { MetaRow } from "./meta-row";
import { TrackedNextLink } from "./tracked-next-link";

export function KeepReading({
  fromSlug,
  posts,
}: {
  fromSlug: string;
  posts: Post[];
}) {
  if (posts.length === 0) return null;

  return (
    <MetaRow label="Keep reading">
      <ul className="flex flex-col gap-6">
        {posts.map((post, index) => (
          <li key={post.slug}>
            <TrackedNextLink
              href={`/${post.slug}`}
              transitionTypes={["nav-forward"]}
              event="related_article_clicked"
              eventParams={{
                from_slug: fromSlug,
                to_slug: post.slug,
                position: index + 1,
              }}
              className="group flex flex-col gap-1"
            >
              <span className="text-md font-medium text-muted tracking-tight text-pretty transition-colors duration-140 ease-out group-hover:text-ink group-focus-visible:text-ink">
                {post.title}
              </span>
              <span className="text-base text-muted text-pretty">
                {post.dek}
              </span>
              <span className="text-xs text-faint">
                {formatPostDate(post.date)} · {post.readTime}
              </span>
            </TrackedNextLink>
          </li>
        ))}
      </ul>
    </MetaRow>
  );
}
