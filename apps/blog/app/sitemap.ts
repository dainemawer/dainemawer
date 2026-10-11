import type { MetadataRoute } from "next";
import { laterPages, pagePath } from "@/lib/pagination";
import { getAllPosts, getPostsByTopic } from "@/lib/posts";
import { site } from "@/lib/site";
import { getAllTils } from "@/lib/til";
import { topics } from "@/lib/topics";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: site.url, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${site.url}/contact`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${site.url}/til`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${site.url}/uses`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${site.url}/now`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${site.url}/agents`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site.url}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const topicRoutes: MetadataRoute.Sitemap = topics.map((topic) => ({
    url: `${site.url}/topics/${topic.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  // Later pages of each index are canonical, indexable URLs in their own
  // right (each is canonical to itself), so they're listed — at low
  // priority, since every article on them is also listed directly below.
  const paginatedRoutes: MetadataRoute.Sitemap = [
    { base: "/", count: getAllPosts().length },
    ...topics.map((topic) => ({
      base: `/topics/${topic.slug}`,
      count: getPostsByTopic(topic.slug).length,
    })),
  ].flatMap(({ base, count }) =>
    laterPages(count).map((page) => ({
      url: `${site.url}${pagePath(base, page)}`,
      changeFrequency: "weekly" as const,
      priority: 0.3,
    })),
  );

  const postRoutes: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${site.url}/${post.slug}`,
    lastModified: post.updated ?? post.date,
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  const tilRoutes: MetadataRoute.Sitemap = getAllTils().map((til) => ({
    url: `${site.url}/til/${til.slug}`,
    lastModified: til.date,
    changeFrequency: "yearly",
    priority: 0.4,
  }));

  return [
    ...staticRoutes,
    ...topicRoutes,
    ...paginatedRoutes,
    ...postRoutes,
    ...tilRoutes,
  ];
}
