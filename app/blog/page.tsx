import type { Metadata } from 'next'
import Script from 'next/script'

const jsonLd = {
	"@context": "https://schema.org",
	"@type": "Blog",
	"name": "Daine Mawer's Blog",
	"description": "Insights on frontend systems, team leadership, and scalable strategy from a decade of experience in frontend engineering.",
	"url": "https://dainemawer.com/blog",
	"author": {
		"@type": "Person",
		"name": "Daine Mawer",
		"url": "https://dainemawer.com"
	},
	"publisher": {
		"@type": "Organization",
		"name": "Daine Mawer",
		"logo": {
			"@type": "ImageObject",
			"url": "https://dainemawer.com/logo.png"
		}
	},
	"blogPost": [
		{
			"@type": "BlogPosting",
			"headline": "Scaling Design Systems Without Slowing Down",
			"description": "Learn how to scale your design system while maintaining velocity and developer experience.",
			"datePublished": "2024-03-20",
			"author": {
				"@type": "Person",
				"name": "Daine Mawer"
			}
		},
		{
			"@type": "BlogPosting",
			"headline": "Principles of a Principal: Leading by Example",
			"description": "Key principles for leading frontend engineering teams effectively.",
			"datePublished": "2024-03-15",
			"author": {
				"@type": "Person",
				"name": "Daine Mawer"
			}
		}
	]
}

export const metadata: Metadata = {
	title: 'Blog',
	description: 'Insights on frontend systems, team leadership, and scalable strategy from a decade of experience in frontend engineering.',
	openGraph: {
		title: 'Blog | Frontend Engineering Insights',
		description: 'Insights on frontend systems, team leadership, and scalable strategy from a decade of experience in frontend engineering.',
	},
	twitter: {
		title: 'Blog | Frontend Engineering Insights',
		description: 'Insights on frontend systems, team leadership, and scalable strategy from a decade of experience in frontend engineering.',
	},
}

export default function BlogPage() {
	return (
		<>
			<Script
				id="blog-schema"
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			{/* Blog content */}
		</>
	)
}
