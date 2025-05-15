import { sanityFetch } from '@/lib/sanity/client/live';
import { postsArchiveQuery } from '@/lib/sanity/queries/queries';
import { NextResponse } from 'next/server';
import { PostsArchiveQueryResult } from '@/sanity.types';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  const { data: posts } = await sanityFetch({
    query: postsArchiveQuery,
    params: { from: 0, to: 100, filters: {} }, // Get last 100 posts
  });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dainemawer.com';

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wfw="http://wellformedweb.org/CommentAPI/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Daine Mawer</title>
    <link>${baseUrl}</link>
    <description>Latest articles and insights from Daine Mawer</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss" rel="self" type="application/rss+xml" />
    ${posts.results
      .map(
        (post: NonNullable<PostsArchiveQueryResult['results'][number]>) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/articles/${post.slug}</link>
      <guid>${baseUrl}/articles/${post.slug}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description><![CDATA[${post.excerpt || ''}]]></description>
      ${post.author ? `<dc:creator><![CDATA[${post.author.firstName} ${post.author.lastName}]]></dc:creator>` : ''}
      ${
        post.categories
          ?.map((cat) => (cat.title ? `<category><![CDATA[${cat.title}]]></category>` : ''))
          .join('') || ''
      }
    </item>`,
      )
      .join('')}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
