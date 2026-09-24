import Link from "next/link";
import { formatPostDate } from "@/lib/format";
import type { Post } from "@/lib/posts";

export function PostListItem({
  post,
  headingLevel: Heading = "h2",
}: {
  post: Post;
  headingLevel?: "h2" | "h3";
}) {
  return (
    <article>
      <Link
        href={`/${post.slug}`}
        transitionTypes={["nav-forward"]}
        className="group grid grid-cols-1 gap-x-12 gap-y-1 sm:grid-cols-meta sm:items-baseline sm:gap-y-0"
      >
        <time dateTime={post.date} className="text-sm text-muted sm:text-right">
          {formatPostDate(post.date)}
        </time>
        <div className="flex flex-col gap-1">
          <Heading className="text-xl font-medium text-muted tracking-tight text-pretty transition-colors duration-140 ease-out group-hover:text-ink group-focus-visible:text-ink">
            {post.title}
          </Heading>
          <p className="text-md text-muted text-pretty">{post.dek}</p>
          <div className="mt-0.5 text-xs text-faint">{post.readTime}</div>
        </div>
      </Link>
    </article>
  );
}
