import { NextResponse } from 'next/server'

// Dummy data for demonstration
const articles = [
	{
		title: 'Getting Started with Next.js',
		slug: 'getting-started-with-nextjs',
		description: 'Learn how to build modern web applications with Next.js',
		date: new Date().toISOString(),
	},
	{
		title: 'Building Modern Web Applications',
		slug: 'building-modern-web-applications',
		description: 'Best practices for building scalable web applications',
		date: new Date().toISOString(),
	},
	{
		title: 'The Future of Web Development',
		slug: 'the-future-of-web-development',
		description: 'Exploring upcoming trends in web development',
		date: new Date().toISOString(),
	},
]

export async function GET() {
	const baseUrl = 'https://dainemawer.com'

	const xml = `<?xml version="1.0" encoding="UTF-8" ?>
		<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wfw="http://wellformedweb.org/CommentAPI/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
			<channel>
				<title>Daine Mawer</title>
				<link>${baseUrl}</link>
				<description>Web development insights and articles</description>
				<language>en</language>
				<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
				<atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
				${articles
					.map(
						(article) => `
					<item>
						<title><![CDATA[${article.title}]]></title>
						<link>${baseUrl}/articles/${article.slug}</link>
						<guid>${baseUrl}/articles/${article.slug}</guid>
						<pubDate>${new Date(article.date).toUTCString()}</pubDate>
						<description><![CDATA[${article.description}]]></description>
					</item>
				`
					)
					.join('')}
			</channel>
		</rss>`

	return new NextResponse(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600, s-maxage=3600',
		},
	})
}
