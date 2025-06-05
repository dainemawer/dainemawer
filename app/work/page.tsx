import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ExternalLink, Calendar, User } from "lucide-react"
import Link from "next/link"
import { fetchWorkItems } from "@/lib/contentful"
import { Metadata } from "next"
import { Pagination } from "@/components/ui/pagination"

interface WorkPageProps {
	searchParams: { page?: string; category?: string }
}

export const metadata: Metadata = {
	title: 'Work | Daine Mawer',
	description: 'Frontend engineering projects, design systems, and team leadership initiatives that have scaled organizations and improved developer experience.',
	openGraph: {
		title: 'Work | Frontend Engineering Projects',
		description: 'Frontend engineering projects, design systems, and team leadership initiatives that have scaled organizations and improved developer experience.',
	},
	twitter: {
		title: 'Work | Frontend Engineering Projects',
		description: 'Frontend engineering projects, design systems, and team leadership initiatives that have scaled organizations and improved developer experience.',
	},
}

const categories = [
	{ id: 'all', label: 'All Projects' },
	{ id: 'design-systems', label: 'Design Systems' },
	{ id: 'frontend-architecture', label: 'Frontend Architecture' },
	{ id: 'team-leadership', label: 'Team Leadership' },
	{ id: 'performance', label: 'Performance' },
]

export default async function WorkPage({ searchParams }: WorkPageProps) {
	const { page, category } = await searchParams
	const currentPage = Number(page) || 1
	const { items: workItems, totalPages } = await fetchWorkItems({
		page: currentPage,
		limit: 6,
		category: category === 'all' ? undefined : category,
	})

	const featuredWork = workItems.filter(item => item.fields.isFeatured)
	const regularWork = workItems.filter(item => !item.fields.isFeatured)

	return (
		<>
			{/* Work Header */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
				<h1 className="text-5xl font-bold text-gray-900 mb-4">Work</h1>
				<p className="text-xl text-gray-600">
					Frontend engineering projects, design systems, and team leadership initiatives that have scaled organizations
					and improved developer experience.
				</p>
			</section>

			{/* Filter Tags */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
				<div className="flex flex-wrap gap-3">
					{categories.map((cat) => (
						<Link
							key={cat.id}
							href={`/work${cat.id === 'all' ? '' : `?category=${cat.id}`}`}
						>
							<Button
								variant="outline"
								className={`rounded-full ${
									(category === cat.id || (!category && cat.id === 'all'))
										? 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
										: ''
								}`}
							>
								{cat.label}
							</Button>
						</Link>
					))}
				</div>
			</section>

			{/* Featured Work */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
				<h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Projects</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					{featuredWork.map((work) => (
						<div
							key={work.sys.id}
							className="bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-2xl overflow-hidden relative h-80 group"
						>
							<Link href={`/work/${work.fields.slug}`}>
								<div className="absolute inset-0 p-8 flex flex-col justify-between">
									<div className="flex justify-between items-start">
										<span className="bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full">
											{work.fields.category}
										</span>
										<ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
									</div>
									<div>
										<h3 className="text-white text-2xl font-bold mb-2">{work.fields.title}</h3>
										<p className="text-white/90 text-sm mb-3">{work.fields.excerpt}</p>
										<div className="flex items-center text-white/80 text-sm">
											<User className="w-4 h-4 mr-2" />
											<span className="mr-4">{work.fields.client}</span>
											<Calendar className="w-4 h-4 mr-2" />
											<span>{new Date(work.fields.timeline).getFullYear()}</span>
										</div>
									</div>
								</div>
							</Link>
						</div>
					))}
				</div>
			</section>

			{/* All Projects */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
				<h2 className="text-2xl font-bold text-gray-900 mb-8">All Projects</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{regularWork.map((work) => (
						<div
							key={work.sys.id}
							className="bg-gradient-to-br from-orange-200 via-orange-300 to-pink-300 rounded-2xl overflow-hidden relative h-64 group"
						>
							<Link href={`/work/${work.fields.slug}`}>
								<div className="absolute inset-0 p-6 flex flex-col justify-between">
									<div className="flex justify-between items-start">
										<span className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full">
											{work.fields.category}
										</span>
										<ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
									</div>
									<div>
										<h3 className="text-white text-xl font-bold mb-2">{work.fields.title}</h3>
										<p className="text-white/90 text-sm mb-3">{work.fields.excerpt}</p>
										<div className="flex items-center text-white/80 text-xs">
											<User className="w-3 h-3 mr-1" />
											<span className="mr-3">{work.fields.client}</span>
											<Calendar className="w-3 h-3 mr-1" />
											<span>{new Date(work.fields.completedAt).getFullYear()}</span>
										</div>
									</div>
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
					<p className="text-xl text-gray-600 mb-12 leading-relaxed">
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
