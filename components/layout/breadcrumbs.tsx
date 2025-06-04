'use client'

import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import Script from 'next/script'

interface BreadcrumbItem {
	label: string
	href: string
}

interface BreadcrumbsProps {
	items: BreadcrumbItem[]
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
	const breadcrumbSchema = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		'itemListElement': items.map((item, index) => ({
			'@type': 'ListItem',
			'position': index + 1,
			'name': item.label,
			'item': `https://dainemawer.com${item.href}`
		}))
	}

	return (
		<>
			<Script
				id="breadcrumb-schema"
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
			/>
			<nav aria-label="Breadcrumb" className="mb-8">
				<ol className="flex items-center space-x-2 text-sm text-gray-500">
					<li>
						<Link href="/" className="flex items-center hover:text-gray-900">
							<Home className="w-4 h-4" />
							<span className="sr-only">Home</span>
						</Link>
					</li>
					{items.map((item, index) => (
						<li key={item.href} className="flex items-center">
							<ChevronRight className="w-4 h-4 mx-2" />
							{index === items.length - 1 ? (
								<span className="text-gray-900">{item.label}</span>
							) : (
								<Link href={item.href} className="hover:text-gray-900">
									{item.label}
								</Link>
							)}
						</li>
					))}
				</ol>
			</nav>
		</>
	)
}
