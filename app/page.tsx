import { Button } from "@/components/ui/button"
import { Zap, Users, Star, ArrowRight } from "lucide-react"
import type { Metadata } from 'next'
import Script from 'next/script'
import Image from 'next/image'
import Newsletter from '@/components/newsletter'
import { Marquee } from "@/components/magicui/marquee"

const jsonLd = {
	"@context": "https://schema.org",
	"@type": "Person",
	"name": "Daine Mawer",
	"url": "https://dainemawer.com",
	"jobTitle": "Frontend Engineering Leader",
	"worksFor": {
		"@type": "Organization",
		"name": "Daine Mawer"
	},
	"description": "Frontend Engineering Leader specializing in scaling teams, systems, and strategy for modern web applications.",
	"sameAs": [
		"https://twitter.com/dainemawer",
		"https://github.com/dainemawer",
		"https://linkedin.com/in/dainemawer"
	],
	"knowsAbout": [
		"Frontend Engineering",
		"Team Leadership",
		"Design Systems",
		"Web Development",
		"System Architecture"
	]
}

export const metadata: Metadata = {
	title: 'Frontend Engineering Leader & Systems Architect',
	description: 'Scaling frontend teams and systems for the modern web. Over a decade of experience leading the strategy behind frontend systems that serve millions — reliably, accessibly, and fast.',
	openGraph: {
		title: 'Frontend Engineering Leader & Systems Architect',
		description: 'Scaling frontend teams and systems for the modern web. Over a decade of experience leading the strategy behind frontend systems that serve millions — reliably, accessibly, and fast.',
		images: [
			{
				url: '/og-image.jpg',
				width: 1200,
				height: 630,
				alt: 'Daine Mawer - Frontend Engineering Leader',
			},
		],
	},
	twitter: {
		title: 'Frontend Engineering Leader & Systems Architect',
		description: 'Scaling frontend teams and systems for the modern web. Over a decade of experience leading the strategy behind frontend systems that serve millions — reliably, accessibly, and fast.',
		images: ['/og-image.jpg'],
	},
}

const clients = [
	{
		id: 1,
		image: '/clients/google.png',
		username: 'Google',
	},
	{
		id: 2,
		image: '/clients/amazon.png',
		username: 'Amazon',
	},
	{
		id: 3,
		image: '/clients/facebook.png',
		username: 'Facebook',
	},
	{
		id: 4,
		image: '/clients/microsoft.png',
		username: 'Microsoft',
	},
	{
		id: 5,
		image: '/clients/apple.png',
		username: 'Apple',
	},
]

export default function Homepage() {
	return (
		<>
			<Script
				id="person-schema"
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			{/* Hero Section */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
				<div className="max-w-4xl mx-auto text-center">
					<div className="relative w-32 h-32 mx-auto mb-8">
						<Image
							src="/profile.jpg"
							alt="Daine Mawer - Frontend Engineering Leader"
							fill
							priority
							className="rounded-full object-cover"
							sizes="(max-width: 768px) 128px, 256px"
						/>
					</div>
					<h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-8">
						Scaling Frontend Teams and Systems for the Modern Web.
					</h1>
					<p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
						With over a decade of hands-on experience, I lead the strategy behind frontend systems that serve millions —
						reliably, accessibly, and fast.
					</p>
					<div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
						<Marquee className="[--duration:20s]">
							{clients.map((client) => (
								<figure key={client.id}>
									<Image src={client.image} alt={client.username} width={100} height={100} />
								</figure>
							))}
						</Marquee>
					</div>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Button className="bg-black text-white hover:bg-gray-800 px-8 py-3 text-base font-medium rounded-full">
							Join Today
						</Button>
						<Button
							variant="outline"
							className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 text-base font-medium rounded-full"
						>
							Work With Me
						</Button>
					</div>
				</div>
			</section>

			{/* Leading Frontend Engineering Section */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
				<div className="mb-16">
					<h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
						Leading Frontend
						<br />
						Engineering at Scale
					</h2>
					<p className="text-xl text-gray-600 max-w-3xl leading-relaxed">
						As a Frontend Engineering Leader, I scale teams, systems, and strategy to help organizations build fast,
						reliable web apps — without burning out their developers.
					</p>
				</div>

				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
					{/* Scalable UI Systems */}
					<div className="space-y-4">
						<div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
							<Zap className="w-6 h-6 text-gray-700" />
						</div>
						<h3 className="text-xl font-bold text-gray-900">Scalable UI Systems</h3>
						<p className="text-gray-600 leading-relaxed">
							I design component systems and design systems that promote consistency, accessibility, and long-term
							maintainability while empowering teams to move fast without breaking things.
						</p>
					</div>

					{/* Developer Experience */}
					<div className="space-y-4">
						<div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
							<Users className="w-6 h-6 text-gray-700" />
						</div>
						<h3 className="text-xl font-bold text-gray-900">Developer Experience</h3>
						<p className="text-gray-600 leading-relaxed">
							From tooling to testing to deployment automation, I help teams streamline their workflows and boost
							productivity — because happy developers build better products.
						</p>
					</div>

					{/* Frontend Strategy & Leadership */}
					<div className="space-y-4">
						<div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
							<Star className="w-6 h-6 text-gray-700" />
						</div>
						<h3 className="text-xl font-bold text-gray-900">Frontend Strategy & Leadership</h3>
						<p className="text-gray-600 leading-relaxed">
							I bridge product, design, and engineering — translating business goals into technical solutions and
							guiding teams through complex frontend decisions with clarity and confidence.
						</p>
					</div>
				</div>

				<div className="mt-16 pt-8 border-t border-gray-200">
					<p className="text-gray-600 mb-4">Want to bring frontend clarity to your team?</p>
					<a href="#" className="text-gray-900 font-medium hover:text-gray-600 inline-flex items-center">
						Schedule a meeting with me
						<ArrowRight className="w-4 h-4 ml-2" />
					</a>
				</div>
			</section>

			{/* Insights Section */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
				<div className="mb-16">
					<h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
						Insights on Frontend
						<br />
						Leadership & Strategy
					</h2>
					<p className="text-xl text-gray-600 leading-relaxed">
						Lessons from 10+ years of scaling frontend architecture, design systems, and engineering teams.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
					{/* Large card - spans 2 columns on larger screens */}
					<div className="md:col-span-2 lg:col-span-2 bg-gradient-to-br from-blue-200 via-blue-300 to-blue-400 rounded-2xl p-8 text-white min-h-[300px] flex flex-col justify-end relative overflow-hidden">
						<div className="relative z-10">
							<h3 className="text-2xl font-bold mb-2">
								Scaling Design Systems
								<br />
								Without Slowing Down
							</h3>
						</div>
					</div>

					{/* Top right card */}
					<div className="bg-gradient-to-br from-orange-200 via-orange-300 to-pink-300 rounded-2xl p-8 text-white min-h-[300px] flex flex-col justify-end relative overflow-hidden">
						<div className="relative z-10">
							<h3 className="text-xl font-bold">
								Principles of a<br />
								Principal: Leading by
								<br />
								Example
							</h3>
						</div>
					</div>

					{/* Bottom left card */}
					<div className="bg-gradient-to-br from-teal-200 via-teal-300 to-blue-300 rounded-2xl p-8 text-white min-h-[250px] flex flex-col justify-end relative overflow-hidden">
						<div className="relative z-10">
							<h3 className="text-xl font-bold">
								How I Lead Frontend
								<br />
								Kickoffs on Enterprise
								<br />
								Projects
							</h3>
						</div>
					</div>

					{/* Bottom middle card */}
					<div className="bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-2xl p-8 text-white min-h-[250px] flex flex-col justify-end relative overflow-hidden">
						<div className="relative z-10">
							<h3 className="text-xl font-bold">
								Frontend
								<br />
								Architecture for DX
								<br />
								and Performance
							</h3>
						</div>
					</div>

					{/* Bottom right card */}
					<div className="bg-gradient-to-br from-yellow-200 via-yellow-300 to-orange-300 rounded-2xl p-8 text-white min-h-[250px] flex flex-col justify-end relative overflow-hidden">
						<div className="relative z-10">
							<h3 className="text-xl font-bold">
								Principles of a<br />
								Principal: Leading by
								<br />
								Example
							</h3>
						</div>
					</div>
				</div>

				<div className="text-center">
					<Button className="bg-black text-white hover:bg-gray-800 px-8 py-3 rounded-full">View All</Button>
				</div>
			</section>

			{/* Testimonials Section */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
				<div className="mb-16">
					<h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
						Trusted by Engineers,
						<br />
						Designers & Product Teams
					</h2>
					<p className="text-xl text-gray-600 leading-relaxed mb-6">
						Hear from the people I&apos;ve collaborated with on high-impact frontend projects.
					</p>
					<a href="#" className="text-gray-900 font-medium hover:text-gray-600 inline-flex items-center">
						Write a Review
						<ArrowRight className="w-4 h-4 ml-2" />
					</a>
				</div>

				<div className="grid md:grid-cols-3 gap-8">
					{/* Testimonial 1 */}
					<div className="space-y-6">
						<div className="relative w-16 h-16">
							<Image
								src="/testimonials/alex.jpg"
								alt="Alex M."
								fill
								className="rounded-full object-cover"
								sizes="64px"
							/>
						</div>
						<p className="text-gray-600 leading-relaxed">
							&quot;Dave has a rare ability to combine deep technical expertise with strategic thinking. He helped us
							redesign our frontend architecture while building a design system that actually empowered our developers
							instead of constraining them.&quot;
						</p>
						<div className="text-sm text-gray-500">— Alex M., Head of Product, B2B SaaS</div>
					</div>

					{/* Testimonial 2 */}
					<div className="space-y-6">
						<div className="relative w-16 h-16">
							<Image
								src="/testimonials/sarah.jpg"
								alt="Sarah K."
								fill
								className="rounded-full object-cover"
								sizes="64px"
							/>
						</div>
						<p className="text-gray-600 leading-relaxed">
						&quot;Never felt a care ability to combine deep technical expertise with strategic thinking. He helped us
							redesign our frontend architecture while building a design system that actually empowered our developers
							instead of constraining them.&quot;
						</p>
						<div className="text-sm text-gray-500">— Alex M., Head of Product, B2B SaaS</div>
					</div>

					{/* Testimonial 3 */}
					<div className="space-y-6">
						<div className="relative w-16 h-16">
							<Image
								src="/testimonials/michael.jpg"
								alt="Michael R."
								fill
								className="rounded-full object-cover"
								sizes="64px"
							/>
						</div>
						<p className="text-gray-600 leading-relaxed">
						&quot;Dave has a rare ability to combine deep technical expertise with strategic thinking. He helped us
							redesign our frontend architecture while building a design system that actually empowered our developers
							instead of constraining them.&quot;
						</p>
						<div className="text-sm text-gray-500">— Alex M., Head of Product, B2B SaaS</div>
					</div>
				</div>
			</section>

			{/* Newsletter Section */}
			<Newsletter />
		</>
	)
}
