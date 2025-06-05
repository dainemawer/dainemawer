import Link from 'next/link'
import { fetchMenu } from '@/lib/contentful'
import { MenuItem } from '@/types/contentful'

interface NavigationProps {
	menuName: string
}

export default async function Navigation({ menuName }: NavigationProps) {
	const menu = await fetchMenu(menuName)

	if (!menu) {
		return null
	}

	const renderMenuItem = (item: MenuItem) => {
		const hasChildren = item.children && item.children.length > 0

		return (
			<li key={item.url} className="relative group">
				<Link
					href={item.url}
					className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
				>
					{item.label}
				</Link>
				{hasChildren && (
					<ul className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
						{item.children.map((child) => (
							<li key={child.url}>
								<Link
									href={child.url}
									className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
								>
									{child.label}
								</Link>
							</li>
						))}
					</ul>
				)}
			</li>
		)
	}

	return (
		<nav className="bg-white shadow-sm">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-16">
					<div className="flex">
						<div className="flex-shrink-0 flex items-center">
							<Link href="/" className="text-xl font-bold text-gray-900">
								Daine Mawer
							</Link>
						</div>
						<div className="hidden sm:ml-6 sm:flex sm:space-x-8">
							{menu.fields.items.map(renderMenuItem)}
						</div>
					</div>
				</div>
			</div>
		</nav>
	)
}
