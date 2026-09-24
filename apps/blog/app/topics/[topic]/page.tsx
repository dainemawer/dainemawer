import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { DirectionalTransition } from "@/components/directional-transition";
import { MetaRow } from "@/components/meta-row";
import { PageShell } from "@/components/page-shell";
import { PostListItem } from "@/components/post-list-item";
import { TopicFilterNav } from "@/components/topic-filter-nav";
import { getPostsByTopic } from "@/lib/posts";
import { getTopicBySlug, topics } from "@/lib/topics";

export function generateStaticParams() {
  return topics.map((topic) => ({ topic: topic.slug }));
}

export async function generateMetadata(
  props: PageProps<"/topics/[topic]">,
): Promise<Metadata> {
  const { topic: slug } = await props.params;
  const topic = getTopicBySlug(slug);
  if (!topic) return {};
  return {
    title: `${topic.name} articles`,
    description: topic.dek,
    alternates: {
      canonical: `/topics/${slug}`,
      types: { "text/markdown": `/topics/${slug}.md` },
    },
  };
}

export default async function TopicPage(props: PageProps<"/topics/[topic]">) {
  const { topic: slug } = await props.params;
  const topic = getTopicBySlug(slug);
  if (!topic) notFound();

  const posts = getPostsByTopic(topic.slug);

  return (
    <DirectionalTransition>
      <PageShell
        sidebar={<TopicFilterNav topics={topics} activeSlug={topic.slug} />}
      >
        <div className="mx-auto max-w-content">
          <Breadcrumb
            items={[{ label: "Home", href: "/" }, { label: "Topics" }]}
          />

          <h1 className="mt-4.5 text-2xl text-ink tracking-tight">
            {topic.name}
          </h1>
          <div className="mt-2 text-md text-muted text-pretty">{topic.dek}</div>
          <div className="mt-5 flex items-baseline gap-x-2 text-sm text-muted">
            <span>
              {posts.length} article{posts.length === 1 ? "" : "s"}
            </span>
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
          </div>
        </div>
      </PageShell>
    </DirectionalTransition>
  );
}
