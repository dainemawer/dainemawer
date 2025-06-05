import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { fetchArticles } from "@/lib/contentful"
import Image from "next/image"
import { Metadata } from "next"
import { Pagination } from "@/components/ui/pagination"

interface ArticlesPageProps {
	searchParams: { page?: string }
}

export const metadata: Metadata = {
	title: 'Articles | Daine Mawer',
	description: 'Real-world writing on frontend leadership, scalable UI systems, and developer experience.',
	openGraph: {
		title: 'Articles | Frontend Engineering Insights',
		description: 'Real-world writing on frontend leadership, scalable UI systems, and developer experience.',
	},
	twitter: {
		title: 'Articles | Frontend Engineering Insights',
		description: 'Real-world writing on frontend leadership, scalable UI systems, and developer experience.',
	},
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
	const { page } = await searchParams
	const currentPage = Number(page) || 1
	const { items: articles, totalPages } = await fetchArticles({
		page: currentPage,
		limit: 9, // Show 9 articles per page
	})

	const featuredArticles = articles.filter(article => article.fields.isFeatured)
	const regularArticles = articles.filter(article => !article.fields.isFeatured)

	// Get the first featured article for the large card
	const mainFeatured = featuredArticles[0]
	// Get the next two featured articles for the right column
	const secondaryFeatured = featuredArticles.slice(1, 3)

	return (
		<>
			{/* Blog Header */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
				<h1 className="text-5xl font-bold text-gray-900 mb-4">Blog</h1>
				<p className="text-xl text-gray-600">
					Real-world writing on frontend leadership, scalable UI systems, and developer experience.
				</p>
			</section>

			{/* Featured Articles */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
				<h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Articles</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* Large featured article - spans 2 columns */}
					{mainFeatured && (
						<div className="md:col-span-2 bg-gradient-to-br from-teal-200 via-teal-300 to-blue-300 rounded-2xl overflow-hidden relative h-80">
							<Link href={`/articles/${mainFeatured.fields.slug}`}>
								<div className="absolute inset-0 p-8 flex flex-col justify-end">
									{mainFeatured.fields.featuredImage && (
										<div className="absolute inset-0">
											<Image
												src={mainFeatured.fields.featuredImage.url}
												alt={mainFeatured.fields.featuredImage.alt}
												fill
												className="object-cover opacity-20"
											/>
										</div>
									)}
									<span className="text-white text-sm font-medium mb-2">Featured</span>
									<h3 className="text-white text-2xl font-bold">{mainFeatured.fields.title}</h3>
								</div>
							</Link>
						</div>
					)}

					{/* Right column with 2 smaller articles */}
					<div className="flex flex-col space-y-6">
						{/* Top right article */}
						{secondaryFeatured[0] && (
							<div className="bg-gradient-to-br from-orange-200 via-orange-300 to-pink-300 rounded-2xl overflow-hidden relative h-[9.5rem]">
								<Link href={`/articles/${secondaryFeatured[0].fields.slug}`}>
									<div className="absolute inset-0 p-6 flex flex-col justify-end">
										{secondaryFeatured[0].fields.featuredImage && (
											<div className="absolute inset-0">
												<Image
													src={secondaryFeatured[0].fields.featuredImage.url}
													alt={secondaryFeatured[0].fields.featuredImage.alt}
													fill
													className="object-cover opacity-20"
												/>
											</div>
										)}
										<span className="text-white text-sm font-medium mb-1">Featured</span>
										<h3 className="text-white text-xl font-bold">{secondaryFeatured[0].fields.title}</h3>
									</div>
								</Link>
							</div>
						)}

						{/* Bottom right articles */}
						<div className="grid grid-cols-2 gap-6">
							{/* Bottom left article */}
							{secondaryFeatured[1] && (
								<div className="bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-2xl overflow-hidden relative h-[9.5rem]">
									<Link href={`/articles/${secondaryFeatured[1].fields.slug}`}>
										<div className="absolute inset-0 p-4 flex flex-col justify-end">
											{secondaryFeatured[1].fields.featuredImage && (
												<div className="absolute inset-0">
													<Image
														src={secondaryFeatured[1].fields.featuredImage.url}
														alt={secondaryFeatured[1].fields.featuredImage.alt}
														fill
														className="object-cover opacity-20"
													/>
												</div>
											)}
											<span className="text-white text-xs font-medium mb-1">Featured</span>
											<h3 className="text-white text-sm font-bold">{secondaryFeatured[1].fields.title}</h3>
										</div>
									</Link>
								</div>
							)}
						</div>
					</div>
				</div>
			</section>

			{/* More Articles */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
				<h2 className="text-2xl font-bold text-gray-900 mb-8">More Articles</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{regularArticles.map((article) => (
						<div
							key={article.sys.id}
							className="bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-2xl overflow-hidden relative h-48"
						>
							<Link href={`/articles/${article.fields.slug}`}>
								<div className="absolute inset-0 p-6 flex flex-col justify-end">
									{article.fields.featuredImage && (
										<div className="absolute inset-0">
											<Image
												src={article.fields.featuredImage.url}
												alt={article.fields.featuredImage.alt}
												fill
												className="object-cover opacity-20"
											/>
										</div>
									)}
									<span className="text-white text-sm font-medium mb-2">Article</span>
									<h3 className="text-white text-xl font-bold">{article.fields.title}</h3>
								</div>
							</Link>
						</div>
					))}
				</div>

				{/* Pagination */}
				<Pagination totalPages={totalPages} currentPage={currentPage} />
			</section>

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
