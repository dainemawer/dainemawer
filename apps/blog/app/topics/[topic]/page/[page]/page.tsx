import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopicIndex } from "@/components/topic-index";
import {
  laterPages,
  pagePath,
  paginate,
  parsePageParam,
} from "@/lib/pagination";
import { getPostsByTopic } from "@/lib/posts";
import { getTopicBySlug, topics } from "@/lib/topics";

// Pages 2…N of a topic index — same rules as app/page/[page]: page 1 is
// the topic URL itself, and anything past the end is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return topics.flatMap((topic) =>
    laterPages(getPostsByTopic(topic.slug).length).map((page) => ({
      topic: topic.slug,
      page: String(page),
    })),
  );
}

async function resolve(props: PageProps<"/topics/[topic]/page/[page]">) {
  const { topic: slug, page: param } = await props.params;
  const topic = getTopicBySlug(slug);
  const page = parsePageParam(param);
  if (!topic || !page || page < 2) return undefined;
  const posts = getPostsByTopic(topic.slug);
  const slice = paginate(posts, page);
  return slice ? { topic, slice, total: posts.length } : undefined;
}

export async function generateMetadata(
  props: PageProps<"/topics/[topic]/page/[page]">,
): Promise<Metadata> {
  const resolved = await resolve(props);
  if (!resolved) return {};
  const { topic, slice } = resolved;
  const { page, totalPages } = slice;
  const base = `/topics/${topic.slug}`;
  const path = pagePath(base, page);
  return {
    title: `${topic.name} articles — page ${page} of ${totalPages}`,
    description: `Page ${page} of ${totalPages}. ${topic.dek}`,
    alternates: {
      canonical: path,
      types: { "text/markdown": `${path}.md` },
    },
    pagination: {
      previous: pagePath(base, page - 1),
      next: page < totalPages ? pagePath(base, page + 1) : undefined,
    },
  };
}

export default async function TopicPageN(
  props: PageProps<"/topics/[topic]/page/[page]">,
) {
  const resolved = await resolve(props);
  if (!resolved) notFound();
  return <TopicIndex {...resolved} />;
}
