import DefaultPageTemplate from "@/components/layout/template"
import type { Metadata } from 'next'
import Script from 'next/script'
import ContactForm from '@/components/contact-form'

const jsonLd = {
	"@context": "https://schema.org",
	"@type": "ContactPage",
	"name": "Contact Daine Mawer",
	"description": "Get in touch with Daine Mawer, Frontend Engineering Leader, for collaboration opportunities, speaking engagements, or consulting services.",
	"mainEntity": {
		"@type": "Person",
		"name": "Daine Mawer",
		"jobTitle": "Frontend Engineering Leader",
		"contactPoint": {
			"@type": "ContactPoint",
			"contactType": "customer service",
			"email": "hello@dainemawer.com",
			"areaServed": "Worldwide",
			"availableLanguage": ["English"]
		}
	}
}

export const metadata: Metadata = {
	title: 'Contact Daine Mawer - Frontend Engineering Leader',
	description: 'Get in touch with Daine Mawer for collaboration opportunities, speaking engagements, or consulting services. Let\'s discuss how we can work together to scale your frontend systems and teams.',
	openGraph: {
		title: 'Contact Daine Mawer - Frontend Engineering Leader',
		description: 'Get in touch with Daine Mawer for collaboration opportunities, speaking engagements, or consulting services. Let\'s discuss how we can work together to scale your frontend systems and teams.',
		images: [
			{
				url: '/og-image.jpg',
				width: 1200,
				height: 630,
				alt: 'Contact Daine Mawer',
			},
		],
	},
	twitter: {
		title: 'Contact Daine Mawer - Frontend Engineering Leader',
		description: 'Get in touch with Daine Mawer for collaboration opportunities, speaking engagements, or consulting services. Let\'s discuss how we can work together to scale your frontend systems and teams.',
		images: ['/og-image.jpg'],
	},
}

export default function ContactPage() {
	return (
		<>
			<Script
				id="contact-schema"
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<DefaultPageTemplate
				title="Contact"
				subtitle="Ready to scale your frontend team and systems? Let&apos;s discuss how I can help your organization build better, faster."
				currentPage="contact"
				showNewsletter={false}
			>
				<div className="max-w-4xl mx-auto">
					<div className="grid md:grid-cols-2 gap-12">
						{/* Contact Form */}
						<div>
							<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Get In Touch</h2>
							<ContactForm />
						</div>

						{/* Contact Info */}
						<div>
							<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Let&apos;s Work Together</h2>
							<div className="space-y-6">
								<p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
									I work with companies of all sizes to solve complex frontend challenges. Whether you need help with:
								</p>
								<ul className="space-y-3 text-gray-600 dark:text-gray-400">
									<li className="flex items-start">
										<span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
										Scaling your design system and component library
									</li>
									<li className="flex items-start">
										<span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
										Improving developer experience and team productivity
									</li>
									<li className="flex items-start">
										<span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
										Frontend architecture and performance optimization
									</li>
									<li className="flex items-start">
										<span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
										Building and leading frontend engineering teams
									</li>
								</ul>
								<p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
									I&apos;d love to hear about your specific challenges and discuss how we can work together.
								</p>
							</div>
						</div>
					</div>
				</div>
			</DefaultPageTemplate>
		</>
	)
}
