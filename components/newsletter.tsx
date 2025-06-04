'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useState } from 'react'
import { subscribeToNewsletter } from '@/app/actions/newsletter'

const newsletterSchema = z.object({
	email: z.string().email('Please enter a valid email address'),
})

interface NewsletterProps {
	title?: string
	description?: string
	className?: string
}

export default function Newsletter({
	title = "Stay Ahead Of The Curve",
	description = "I share real-world lessons on frontend systems, team leadership, and scalable strategy — straight from the trenches.",
	className = "",
}: NewsletterProps) {
	const [newsletterStatus, setNewsletterStatus] = useState<{
		success?: boolean
		message?: string
	}>({})

	const {
		register: registerNewsletter,
		handleSubmit: handleNewsletterSubmit,
		formState: { errors: newsletterErrors, isSubmitting: isNewsletterSubmitting },
		reset: resetNewsletter,
	} = useForm({
		resolver: zodResolver(newsletterSchema),
	})

	const onNewsletterSubmit = async (data: { email: string }) => {
		try {
			const result = await subscribeToNewsletter(data)
			if (result.success) {
				setNewsletterStatus({
					success: true,
					message: 'Successfully subscribed to the newsletter!',
				})
				resetNewsletter()
			} else {
				setNewsletterStatus({
					success: false,
					message: result.error || 'Failed to subscribe',
				})
			}
		} catch (error) {
			setNewsletterStatus({
				success: false,
				message: error instanceof Error ? error.message : 'An error occurred while subscribing',
			})
		}
	}

	return (
		<section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 ${className}`}>
			<div className="max-w-2xl mx-auto text-center">
				<h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">{title}</h2>
				<p className="text-xl text-gray-600 dark:text-gray-400 mb-12 leading-relaxed">
					{description}
				</p>

				<form onSubmit={handleNewsletterSubmit(onNewsletterSubmit)} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-4">
					<Input
						{...registerNewsletter('email')}
						type="email"
						placeholder="Enter your email address"
						className="flex-1 px-4 py-3 border-gray-300 dark:border-gray-700 rounded-full"
					/>
					<Button
						type="submit"
						disabled={isNewsletterSubmitting}
						className="bg-black text-white hover:bg-gray-800 px-8 py-3 whitespace-nowrap rounded-full"
					>
						{isNewsletterSubmitting ? 'Subscribing...' : 'Subscribe'}
					</Button>
				</form>

				{newsletterErrors.email && (
					<p className="text-sm text-red-500 mb-4">{newsletterErrors.email.message as string}</p>
				)}

				{newsletterStatus.message && (
					<div
						className={`mt-2 rounded-md p-4 ${
							newsletterStatus.success
								? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
								: 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
						}`}
					>
						{newsletterStatus.message}
					</div>
				)}

				<p className="text-sm text-gray-500 dark:text-gray-400">No spam. New content weekly. Unsubscribe anytime.</p>
			</div>
		</section>
	)
}
