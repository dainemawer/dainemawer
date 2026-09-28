import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopicIndex } from "@/components/topic-index";
import { pagePath, paginate } from "@/lib/pagination";
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
  const slice = paginate(getPostsByTopic(topic.slug), 1);
  return {
    title: `${topic.name} articles`,
    description: topic.dek,
    alternates: {
      canonical: `/topics/${slug}`,
      types: { "text/markdown": `/topics/${slug}.md` },
    },
    ...(slice && slice.totalPages > 1
      ? { pagination: { next: pagePath(`/topics/${slug}`, 2) } }
      : {}),
  };
}

export default async function TopicPage(props: PageProps<"/topics/[topic]">) {
  const { topic: slug } = await props.params;
  const topic = getTopicBySlug(slug);
  if (!topic) notFound();

  const posts = getPostsByTopic(topic.slug);
  // Page 1 always exists, even for a topic with no articles yet.
  const slice = paginate(posts, 1) ?? {
    items: [],
    page: 1,
    totalPages: 1,
    offset: 0,
  };

  return <TopicIndex topic={topic} slice={slice} total={posts.length} />;
}
