import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchPage } from '@/lib/contentful'
import { documentToReactComponents } from '@contentful/rich-text-react-renderer'
import { Document } from '@contentful/rich-text-types'

interface PageProps {
	params: {
		slug: string
	}
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { slug } = await params
	const page = await fetchPage(slug)

	if (!page) {
		return {
			title: 'Page Not Found | Daine Mawer',
			description: 'The requested page could not be found.',
		}
	}

	return {
		title: page.fields.seoTitle || `${page.fields.title} | Daine Mawer`,
		description: page.fields.seoDescription,
		openGraph: {
			title: page.fields.seoTitle || page.fields.title,
			description: page.fields.seoDescription,
			images: page.fields.seoImage ? [page.fields.seoImage.url] : [],
		},
		twitter: {
			title: page.fields.seoTitle || page.fields.title,
			description: page.fields.seoDescription,
			images: page.fields.seoImage ? [page.fields.seoImage.url] : [],
		},
	}
}

export default async function DynamicPage({ params }: PageProps) {
	const { slug } = await params
	const page = await fetchPage(slug)

	if (!page) {
		notFound()
	}

	return (
		<article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<header className="mb-8">
				<h1 className="text-4xl font-bold mb-4">{page.fields.title}</h1>
			</header>
			<div className="prose prose-lg max-w-none">
				{documentToReactComponents(page.fields.content as Document)}
			</div>
		</article>
	)
}
