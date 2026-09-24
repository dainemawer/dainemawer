import { getAllPosts } from "@/lib/posts";
import { site } from "@/lib/site";

export function GET() {
  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: site.name,
    home_page_url: site.url,
    feed_url: `${site.url}/feed.json`,
    description: site.tagline,
    author: { name: site.name, url: site.url },
    items: getAllPosts().map((post) => ({
      id: `${site.url}/${post.slug}`,
      url: `${site.url}/${post.slug}`,
      title: post.title,
      summary: post.dek,
      date_published: new Date(post.date).toISOString(),
      ...(post.updated
        ? { date_modified: new Date(post.updated).toISOString() }
        : {}),
    })),
  };

  return Response.json(feed, {
    headers: { "Content-Type": "application/feed+json; charset=utf-8" },
  });
}
