'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Search as SearchIcon } from 'lucide-react'

// Dummy data for demonstration
const searchData = [
	{
		title: 'Getting Started with Next.js',
		description: 'Learn how to build modern web applications with Next.js',
		url: '/articles/getting-started-with-nextjs',
	},
	{
		title: 'Building Modern Web Applications',
		description: 'Best practices for building scalable web applications',
		url: '/articles/building-modern-web-applications',
	},
	{
		title: 'The Future of Web Development',
		description: 'Exploring upcoming trends in web development',
		url: '/articles/the-future-of-web-development',
	},
]

export function Search() {
	const [open, setOpen] = React.useState(false)
	const [query, setQuery] = React.useState('')
	const router = useRouter()

	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault()
				setOpen((open) => !open)
			}
		}

		document.addEventListener('keydown', down)
		return () => document.removeEventListener('keydown', down)
	}, [])

	const filteredResults = React.useMemo(() => {
		if (!query) return searchData

		const searchLower = query.toLowerCase()
		return searchData.filter(
			(item) =>
				item.title.toLowerCase().includes(searchLower) ||
				item.description.toLowerCase().includes(searchLower)
		)
	}, [query])

	return (
		<>
			<button
				onClick={() => setOpen(true)}
				className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
				aria-label="Search"
			>
				<SearchIcon className="h-5 w-5" />
			</button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-[600px]">
					<Command className="rounded-lg border shadow-md">
						<CommandInput
							placeholder="Search articles..."
							value={query}
							onValueChange={setQuery}
						/>
						<CommandList>
							<CommandEmpty>No results found.</CommandEmpty>
							<CommandGroup heading="Articles">
								{filteredResults.map((item) => (
									<CommandItem
										key={item.url}
										onSelect={() => {
											router.push(item.url)
											setOpen(false)
										}}
										className="flex flex-col items-start gap-1 p-3"
									>
										<div className="font-medium">{item.title}</div>
										<div className="text-sm text-gray-500 dark:text-gray-400">
											{item.description}
										</div>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</DialogContent>
			</Dialog>
		</>
	)
}
