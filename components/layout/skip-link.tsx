'use client'

import { useEffect, useState } from 'react'

export default function SkipLink() {
	const [isVisible, setIsVisible] = useState(false)

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Tab') {
				setIsVisible(true)
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [])

	if (!isVisible) return null

	return (
		<a
			href="#main-content"
			className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-black focus:text-white focus:rounded-md"
		>
			Skip to main content
		</a>
	)
}
