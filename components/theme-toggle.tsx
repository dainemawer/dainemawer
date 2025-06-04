'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
	const { theme, setTheme } = useTheme()

	return (
		<button
			onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
			className="relative text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
			aria-label="Toggle theme"
		>
			<div className="relative h-5 w-5">
				<Sun className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
				<Moon className="absolute h-5 w-5 rotate-0 scale-100 transition-transform dark:rotate-90 dark:scale-0" />
			</div>
			<span className="sr-only">Toggle theme</span>
		</button>
	)
}
