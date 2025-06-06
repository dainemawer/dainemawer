import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = 'https://dainemawer.com'

	// Add your blog posts here
	const blogPosts = [
		{
			slug: 'scaling-design-systems',
			lastModified: '2024-03-20',
		},
		{
			slug: 'principles-of-a-principal',
			lastModified: '2024-03-15',
		},
	]

	const routes = [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: 'weekly' as const,
			priority: 1,
		},
		{
			url: `${baseUrl}/blog`,
			lastModified: new Date(),
			changeFrequency: 'daily' as const,
			priority: 0.8,
		},
		{
			url: `${baseUrl}/contact`,
			lastModified: new Date(),
			changeFrequency: 'monthly' as const,
			priority: 0.7,
		},
	]

	const blogRoutes = blogPosts.map((post) => ({
		url: `${baseUrl}/blog/${post.slug}`,
		lastModified: new Date(post.lastModified),
		changeFrequency: 'monthly' as const,
		priority: 0.6,
	}))

	return [...routes, ...blogRoutes]
}
