import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Breadcrumbs from '@/components/layout/breadcrumbs'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ExternalLink, Calendar, User, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { fetchWorkBySlug } from "@/lib/contentful"
import RichText from '@/components/rich-text'

interface WorkPageProps {
	params: {
		slug: string
	}
}

export async function generateMetadata({ params }: WorkPageProps): Promise<Metadata> {
	const { slug } = await params
	const work = await fetchWorkBySlug(slug)

	if (!work) {
		return {
			title: 'Work Not Found | Daine Mawer',
			description: 'The requested work item could not be found.',
		}
	}

	return {
		title: `${work.fields.title} | Daine Mawer`,
		description: work.fields.excerpt,
		openGraph: {
			title: work.fields.title,
			description: work.fields.excerpt,
		},
		twitter: {
			title: work.fields.title,
			description: work.fields.excerpt,
		},
	}
}

export default async function WorkPage({ params }: WorkPageProps) {
	const { slug } = await params
	const work = await fetchWorkBySlug(slug)

	if (!work) {
		notFound()
	}

	return (
		<>
			<Breadcrumbs
				items={[
					{ label: 'Work', href: '/work' },
					{ label: work.fields.title, href: `/work/${slug}` },
				]}
			/>
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
				<Link href="/work">
					<Button variant="ghost" className="gap-2">
						<ArrowLeft className="w-4 h-4" />
						Back to Work
					</Button>
				</Link>
			</section>

			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
					<div>
						<h1 className="text-4xl font-bold text-gray-900 mb-4">{work.fields.title}</h1>
						<div className="flex items-center text-gray-600 gap-4">
							<div className="flex items-center">
								<User className="w-4 h-4 mr-2" />
								<span>{work.fields.client}</span>
							</div>
							<div className="flex items-center">
								<Calendar className="w-4 h-4 mr-2" />
							</div>
						</div>
					</div>
					<Button variant="outline" className="gap-2">
						<ExternalLink className="w-4 h-4" />
						View Project
					</Button>
				</div>
			</section>

			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
				<div className="prose prose-lg max-w-none">
					<RichText content={work.fields.content} />
				</div>
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
