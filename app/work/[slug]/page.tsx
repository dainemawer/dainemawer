import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWorkBySlug } from '@/lib/work'
import { generatePageMetadata } from '@/lib/metadata'
import Breadcrumbs from '@/components/layout/breadcrumbs'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ExternalLink, Code, Zap, Users, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface WorkPageProps {
	params: Promise<{
		slug: string
	}>
}

export async function generateMetadata({ params }: WorkPageProps): Promise<Metadata> {
	const { slug } = await params
	const work = await getWorkBySlug(slug)
	if (!work) return {}

	return generatePageMetadata({
		title: work.title,
		description: work.description,
		path: `/work/${slug}`,
		image: work.coverImage,
	})
}

export default async function WorkPage({ params }: WorkPageProps) {
	const { slug } = await params
	const work = await getWorkBySlug(slug)
	if (!work) notFound()

	return (
		<>
			<Breadcrumbs
				items={[
					{ label: 'Work', href: '/work' },
					{ label: work.title, href: `/work/${slug}` },
				]}
			/>
			<article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<header className="mb-8">
					<h1 className="text-4xl font-bold mb-4">{work.title}</h1>
					<div className="text-gray-500">
						<time dateTime={work.date}>{new Date(work.date).toLocaleDateString()}</time>
					</div>
				</header>
				<div className="prose dark:prose-invert max-w-none">
					{work.content}
				</div>
			</article>

			{/* Back Navigation */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
				<Link href="/work" className="inline-flex items-center text-gray-600 hover:text-gray-900">
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back to Work
				</Link>
			</div>

			{/* Hero Section */}
			<div className="w-full h-96 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 relative overflow-hidden">
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="text-center text-white">
						<span className="bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full mb-4 inline-block">
							Design Systems
						</span>
						<h1 className="text-4xl md:text-5xl font-bold mb-4">Enterprise Design System</h1>
						<p className="text-xl text-white/90 max-w-2xl">
							Scaled component library serving 50+ teams across multiple products
						</p>
					</div>
				</div>
			</div>

			{/* Project Details */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
					{/* Project Info Sidebar */}
					<div className="lg:col-span-1">
						<div className="sticky top-8 space-y-8">
							{/* Project Meta */}
							<div>
								<h3 className="text-lg font-bold text-gray-900 mb-4">Project Details</h3>
								<div className="space-y-4">
									<div>
										<div className="text-sm font-medium text-gray-500 mb-1">Client</div>
										<div className="text-gray-900">TechCorp Enterprise</div>
									</div>
									<div>
										<div className="text-sm font-medium text-gray-500 mb-1">Timeline</div>
										<div className="text-gray-900">8 months (2024)</div>
									</div>
									<div>
										<div className="text-sm font-medium text-gray-500 mb-1">Role</div>
										<div className="text-gray-900">Lead Frontend Architect</div>
									</div>
									<div>
										<div className="text-sm font-medium text-gray-500 mb-1">Team Size</div>
										<div className="text-gray-900">12 engineers</div>
									</div>
								</div>
							</div>

							{/* Technologies */}
							<div>
								<h3 className="text-lg font-bold text-gray-900 mb-4">Technologies</h3>
								<div className="flex flex-wrap gap-2">
									<span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">React</span>
									<span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">TypeScript</span>
									<span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">Storybook</span>
									<span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">Figma</span>
									<span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">Design Tokens</span>
								</div>
							</div>

							{/* External Links */}
							<div>
								<h3 className="text-lg font-bold text-gray-900 mb-4">Links</h3>
								<div className="space-y-3">
									<a href="#" className="flex items-center text-blue-600 hover:text-blue-800 text-sm">
										<ExternalLink className="w-4 h-4 mr-2" />
										View Live System
									</a>
									<a href="#" className="flex items-center text-blue-600 hover:text-blue-800 text-sm">
										<Code className="w-4 h-4 mr-2" />
										Documentation
									</a>
								</div>
							</div>
						</div>
					</div>

					{/* Main Content */}
					<div className="lg:col-span-3">
						<div className="prose prose-lg max-w-none">
							<h2>Project Overview</h2>
							<p className="text-xl text-gray-600 leading-relaxed">
								TechCorp was struggling with inconsistent UI patterns across their product suite. With 50+ engineering
								teams working on different products, maintaining design consistency and development velocity was
								becoming increasingly challenging.
							</p>

							<h2>The Challenge</h2>
							<p>
								The company had grown rapidly, and their frontend architecture hadn&apos;t scaled with them. Teams were
								duplicating components, design patterns were inconsistent, and onboarding new developers took weeks
								instead of days.
							</p>

							<ul>
								<li>50+ teams with different component implementations</li>
								<li>No centralized design system or component library</li>
								<li>Inconsistent user experiences across products</li>
								<li>High maintenance overhead and technical debt</li>
							</ul>

							<h2>The Solution</h2>
							<p>
								I led the design and implementation of a comprehensive design system that would serve as the foundation
								for all frontend development across the organization.
							</p>

							<h3>Design System Architecture</h3>
							<p>
								Built a scalable component library using React and TypeScript, with comprehensive documentation and
								design tokens that could be consumed across multiple platforms.
							</p>

							<h3>Developer Experience</h3>
							<p>
								Created tooling and processes that made it easy for teams to adopt and contribute to the design system,
								including automated testing, visual regression testing, and clear contribution guidelines.
							</p>

							<h3>Governance & Adoption</h3>
							<p>
								Established a design system team and governance model to ensure long-term success and adoption across
								the organization.
							</p>

							<h2>Results</h2>
							<div className="grid md:grid-cols-3 gap-6 my-8">
								<div className="bg-gray-50 p-6 rounded-lg text-center">
									<div className="text-3xl font-bold text-gray-900 mb-2">85%</div>
									<div className="text-gray-600">Faster Development</div>
								</div>
								<div className="bg-gray-50 p-6 rounded-lg text-center">
									<div className="text-3xl font-bold text-gray-900 mb-2">50+</div>
									<div className="text-gray-600">Teams Adopted</div>
								</div>
								<div className="bg-gray-50 p-6 rounded-lg text-center">
									<div className="text-3xl font-bold text-gray-900 mb-2">90%</div>
									<div className="text-gray-600">Code Reuse</div>
								</div>
							</div>

							<p>
								The design system became the foundation for all new product development, significantly improving
								development velocity and user experience consistency across the entire product suite.
							</p>
						</div>

						{/* Image Gallery */}
						<div className="mt-12">
							<h3 className="text-2xl font-bold text-gray-900 mb-6">Project Gallery</h3>
							<div className="grid md:grid-cols-2 gap-6">
								<div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
									<span className="text-gray-500">Component Library</span>
								</div>
								<div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
									<span className="text-gray-500">Design Tokens</span>
								</div>
								<div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
									<span className="text-gray-500">Documentation Site</span>
								</div>
								<div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
									<span className="text-gray-500">Storybook</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Key Achievements */}
			<section className="bg-gray-50 py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Key Achievements</h2>
					<div className="grid md:grid-cols-3 gap-8">
						<div className="text-center">
							<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Zap className="w-8 h-8 text-blue-600" />
							</div>
							<h3 className="text-xl font-bold text-gray-900 mb-2">Faster Development</h3>
							<p className="text-gray-600">
								Reduced component development time by 85% through reusable, well-documented components
							</p>
						</div>
						<div className="text-center">
							<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Users className="w-8 h-8 text-green-600" />
							</div>
							<h3 className="text-xl font-bold text-gray-900 mb-2">Team Adoption</h3>
							<p className="text-gray-600">
								Successfully onboarded 50+ engineering teams with comprehensive training and support
							</p>
						</div>
						<div className="text-center">
							<div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Code className="w-8 h-8 text-purple-600" />
							</div>
							<h3 className="text-xl font-bold text-gray-900 mb-2">Code Quality</h3>
							<p className="text-gray-600">
							 Improved code consistency and reduced technical debt across all product teams
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Related Work */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
				<h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Related Work</h2>
				<div className="grid md:grid-cols-3 gap-6">
					<div className="bg-gradient-to-br from-teal-400 via-teal-500 to-blue-500 rounded-2xl overflow-hidden relative h-64">
						<Link href="/work/performance-optimization">
							<div className="absolute inset-0 p-6 flex flex-col justify-end">
								<h3 className="text-white text-xl font-bold">Performance Optimization</h3>
								<p className="text-white/90 text-sm mt-2">Reduced load times by 60% across platform</p>
							</div>
						</Link>
					</div>
					<div className="bg-gradient-to-br from-orange-200 via-orange-300 to-pink-300 rounded-2xl overflow-hidden relative h-64">
						<Link href="/work/micro-frontend-migration">
							<div className="absolute inset-0 p-6 flex flex-col justify-end">
								<h3 className="text-white text-xl font-bold">Micro-Frontend Migration</h3>
								<p className="text-white/90 text-sm mt-2">Scalable architecture for enterprise teams</p>
							</div>
						</Link>
					</div>
					<div className="bg-gradient-to-br from-purple-400 via-purple-500 to-pink-500 rounded-2xl overflow-hidden relative h-64">
						<Link href="/work/team-leadership">
							<div className="absolute inset-0 p-6 flex flex-col justify-end">
								<h3 className="text-white text-xl font-bold">Team Leadership</h3>
								<p className="text-white/90 text-sm mt-2">Building high-performing frontend teams</p>
							</div>
						</Link>
					</div>
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
