import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPostBySlug } from '@/lib/blog'
import Breadcrumbs from '@/components/layout/breadcrumbs'
import Script from 'next/script'
import Image from 'next/image'

interface BlogPostPageProps {
	params: Promise<{
		slug: string
	}>
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
	const { slug } = await params
	const post = await getPostBySlug(slug)

	if (!post) {
		return {
			title: 'Post Not Found',
			description: 'The requested blog post could not be found.',
		}
	}

	return {
		title: `${post.title} | Daine Mawer's Blog`,
		description: post.description,
		openGraph: {
			title: post.title,
			description: post.description,
			type: 'article',
			publishedTime: post.date,
			authors: [post.author.name],
			images: [
				{
					url: post.author.image,
					width: 1200,
					height: 630,
					alt: post.title,
				},
			],
		},
		twitter: {
			title: post.title,
			description: post.description,
			images: [post.author.image],
		},
	}
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
	const { slug } = await params
	const post = await getPostBySlug(slug)
	if (!post) notFound()

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		"headline": post.title,
		"description": post.description,
		"datePublished": post.date,
		"author": {
			"@type": "Person",
			"name": post.author.name,
			"image": post.author.image,
		},
		"publisher": {
			"@type": "Organization",
			"name": "Daine Mawer",
			"logo": {
				"@type": "ImageObject",
				"url": "/logo.png",
			},
		},
	}

	return (
		<>
			<Script
				id="blog-post-schema"
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
				<Breadcrumbs
					items={[
						{ label: 'Blog', href: '/blog' },
						{ label: post.title, href: `/blog/${slug}` },
					]}
				/>
				<header className="mb-12">
					<h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
						{post.title}
					</h1>
					<div className="flex items-center space-x-4">
						<div className="relative w-12 h-12">
							<Image
								src={post.author.image}
								alt={post.author.name}
								className="rounded-full object-cover"
							/>
						</div>
						<div>
							<p className="text-gray-900 dark:text-gray-100 font-medium">{post.author.name}</p>
							<p className="text-gray-600 dark:text-gray-400">
								{new Date(post.date).toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'long',
									day: 'numeric',
								})}
							</p>
						</div>
					</div>
				</header>

				<div className="prose prose-lg dark:prose-invert max-w-none">
					<pre className="whitespace-pre-wrap">{post.content}</pre>
				</div>
			</article>
		</>
	)
}
