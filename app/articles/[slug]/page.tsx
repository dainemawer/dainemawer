import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Twitter, Linkedin, Share } from "lucide-react"
import { fetchArticleBySlug } from "@/lib/contentful"
import { notFound } from "next/navigation"
import { documentToReactComponents } from "@contentful/rich-text-react-renderer"
import { Metadata } from "next"

interface ArticlePageProps {
	params: {
		slug: string
	}
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
	const { slug } = await params
	const article = await fetchArticleBySlug(slug)

	if (!article) {
		return {
			title: 'Article Not Found',
			description: 'The requested article could not be found.',
		}
	}

	const { title, excerpt, featuredImage } = article.fields

	return {
		title: `${title} | Daine Mawer's Blog`,
		description: excerpt,
		openGraph: {
			title,
			description: excerpt,
			type: 'article',
			publishedTime: article.fields.publishedAt,
			images: featuredImage ? [
				{
					url: featuredImage.url,
					width: 1200,
					height: 630,
					alt: featuredImage.alt,
				},
			] : [],
		},
		twitter: {
			title,
			description: excerpt,
			images: featuredImage ? [featuredImage.url] : [],
		},
	}
}

export default async function ArticlePage({ params }: ArticlePageProps) {
	const { slug } = await params
	const article = await fetchArticleBySlug(slug)
	if (!article) notFound()

	const { title, content, publishedAt, updatedAt, featuredImage, excerpt } = article.fields

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		"headline": title,
		"description": excerpt,
		"datePublished": publishedAt,
		"dateModified": updatedAt,
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
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>

			{/* Hero Image */}
			<div className="w-full h-80 bg-gradient-to-br from-orange-200 via-orange-300 to-yellow-200 relative overflow-hidden">
				{featuredImage && (
					<div
						className="absolute inset-0 opacity-60"
						style={{
							backgroundImage: `url(${featuredImage.url})`,
							backgroundSize: "cover",
							backgroundPosition: "center",
							filter: "sepia(20%) saturate(120%) hue-rotate(15deg)",
						}}
					/>
				)}
			</div>

			{/* Article Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{/* Article Meta */}
				<div className="text-center mb-8">
					<div className="text-sm text-gray-500 mb-4">
						{new Date(publishedAt).toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'long',
							day: 'numeric',
						})}
						{updatedAt !== publishedAt && (
							<> • Updated {new Date(updatedAt).toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'long',
								day: 'numeric',
							})}</>
						)}
					</div>
					<h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight max-w-4xl mx-auto">
						{title}
					</h1>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
					{/* Table of Contents */}
					<div className="lg:col-span-1">
						<div className="sticky top-8">
							<h3 className="text-lg font-bold text-gray-900 mb-4">Table of Contents</h3>
							<nav className="space-y-3">
								{/* We'll need to extract headings from the content for the TOC */}
								{/* For now, this is a placeholder */}
								<a href="#introduction" className="block text-sm text-gray-600 hover:text-gray-900">
									1. Introduction
								</a>
							</nav>

							{/* Social Share */}
							<div className="mt-8 pt-8 border-t border-gray-200">
								<div className="flex space-x-3">
									<button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
										<Twitter className="w-4 h-4 text-gray-600" />
									</button>
									<button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
										<Linkedin className="w-4 h-4 text-gray-600" />
									</button>
									<button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
										<Share className="w-4 h-4 text-gray-600" />
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* Main Content */}
					<div className="lg:col-span-3">
						<div className="prose prose-lg max-w-none">
							{documentToReactComponents(content)}
						</div>
					</div>
				</div>
			</div>

			{/* Newsletter Section */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
				<div className="max-w-2xl mx-auto text-center">
					<h2 className="text-4xl font-bold text-gray-900 mb-6">Stay Ahead Of The Curve</h2>
					<p className="text-xl text-gray-600 mb-12">
						I share real-world lessons on frontend systems, team leadership, and scalable strategy — straight from the
						trenches.
					</p>

					<div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-4">
						<Input
							type="email"
							placeholder="Enter your email address"
							className="flex-1 px-4 py-3 border-gray-300 rounded-full"
						/>
						<Button className="bg-black text-white hover:bg-gray-800 px-8 py-3 whitespace-nowrap rounded-full">
							Sign Up
						</Button>
					</div>

					<p className="text-sm text-gray-500">You&apos;ll hear from me just once a month — no fluff, no spam.</p>
				</div>
			</section>
		</>
	)
}
