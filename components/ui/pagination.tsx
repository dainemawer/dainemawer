"use client"

import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

interface PaginationProps {
	totalPages: number
	currentPage: number
}

export function Pagination({ totalPages, currentPage }: PaginationProps) {
	const pathname = usePathname()
	const searchParams = useSearchParams()

	const createPageURL = (pageNumber: number | string) => {
		const params = new URLSearchParams(searchParams)
		params.set("page", pageNumber.toString())
		return `${pathname}?${params.toString()}`
	}

	// Generate page numbers to show
	const getPageNumbers = () => {
		const pages = []
		const maxVisiblePages = 5
		const halfVisible = Math.floor(maxVisiblePages / 2)

		let startPage = Math.max(1, currentPage - halfVisible)
		const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

		// Adjust start page if we're near the end
		if (endPage - startPage + 1 < maxVisiblePages) {
			startPage = Math.max(1, endPage - maxVisiblePages + 1)
		}

		// Always show first page
		if (startPage > 1) {
			pages.push(1)
			if (startPage > 2) {
				pages.push("...")
			}
		}

		// Add middle pages
		for (let i = startPage; i <= endPage; i++) {
			pages.push(i)
		}

		// Always show last page
		if (endPage < totalPages) {
			if (endPage < totalPages - 1) {
				pages.push("...")
			}
			pages.push(totalPages)
		}

		return pages
	}

	return (
		<nav className="flex justify-center items-center space-x-2 mt-12" aria-label="Pagination">
			{/* Previous button */}
			<Link
				href={createPageURL(currentPage - 1)}
				className={`w-10 h-10 flex items-center justify-center rounded-full border ${
					currentPage === 1
						? "border-gray-200 text-gray-400 cursor-not-allowed"
						: "border-gray-300 text-gray-600 hover:bg-gray-50"
				}`}
				aria-disabled={currentPage === 1}
				tabIndex={currentPage === 1 ? -1 : 0}
			>
				<ArrowLeft className="w-4 h-4" />
				<span className="sr-only">Previous page</span>
			</Link>

			{/* Page numbers */}
			{getPageNumbers().map((page, index) => {
				if (page === "...") {
					return (
						<span key={`ellipsis-${index}`} className="text-gray-600">
							...
						</span>
					)
				}

				return (
					<Link
						key={page}
						href={createPageURL(page)}
						className={`w-10 h-10 flex items-center justify-center rounded-full ${
							page === currentPage
								? "bg-gray-900 text-white"
								: "border border-gray-300 text-gray-600 hover:bg-gray-50"
						}`}
						aria-current={page === currentPage ? "page" : undefined}
					>
						{page}
					</Link>
				)
			})}

			{/* Next button */}
			<Link
				href={createPageURL(currentPage + 1)}
				className={`w-10 h-10 flex items-center justify-center rounded-full border ${
					currentPage === totalPages
						? "border-gray-200 text-gray-400 cursor-not-allowed"
						: "border-gray-300 text-gray-600 hover:bg-gray-50"
				}`}
				aria-disabled={currentPage === totalPages}
				tabIndex={currentPage === totalPages ? -1 : 0}
			>
				<ArrowRight className="w-4 h-4" />
				<span className="sr-only">Next page</span>
			</Link>
		</nav>
	)
}
