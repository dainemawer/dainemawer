'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function PreviewBanner() {
	const [isPreview, setIsPreview] = useState(false)

	useEffect(() => {
		setIsPreview(document.cookie.includes('preview=true'))
	}, [])

	if (!isPreview) {
		return null
	}

	return (
		<div className="bg-yellow-100 border-b border-yellow-200">
			<div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between flex-wrap">
					<div className="w-0 flex-1 flex items-center">
						<span className="flex p-2 rounded-lg bg-yellow-200">
							<svg
								className="h-6 w-6 text-yellow-600"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
								/>
							</svg>
						</span>
						<p className="ml-3 font-medium text-yellow-800 truncate">
							<span className="md:hidden">Preview Mode</span>
							<span className="hidden md:inline">
								You are viewing the site in preview mode. This shows unpublished content.
							</span>
						</p>
					</div>
					<div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
						<Link
							href="/api/preview/exit"
							className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-yellow-800 bg-yellow-200 hover:bg-yellow-300"
						>
							Exit Preview
						</Link>
					</div>
				</div>
			</div>
		</div>
	)
}
