'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useState } from 'react'
import { sendContactMessage } from '@/app/actions/contact'

const contactSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
	email: z.string().email('Please enter a valid email address'),
	message: z.string().min(10, 'Message must be at least 10 characters'),
})

interface ContactFormProps {
	className?: string
}

export default function ContactForm({ className = "" }: ContactFormProps) {
	const [contactStatus, setContactStatus] = useState<{
		success?: boolean
		message?: string
	}>({})

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
	} = useForm({
		resolver: zodResolver(contactSchema),
	})

	const onSubmit = async (data: z.infer<typeof contactSchema>) => {
		try {
			const result = await sendContactMessage(data)
			if (result.success) {
				setContactStatus({
					success: true,
					message: 'Message sent successfully! I\'ll get back to you soon.',
				})
				reset()
			} else {
				setContactStatus({
					success: false,
					message: result.error || 'Failed to send message',
				})
			}
		} catch (error) {
			setContactStatus({
				success: false,
				message: error instanceof Error ? error.message : 'An error occurred while sending your message',
			})
		}
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className={`space-y-6 ${className}`}>
			<div>
				<Input
					{...register('name')}
					type="text"
					placeholder="Your name"
					className="w-full px-4 py-3 border-gray-300 dark:border-gray-700 rounded-lg"
				/>
				{errors.name && (
					<p className="mt-1 text-sm text-red-500">{errors.name.message as string}</p>
				)}
			</div>

			<div>
				<Input
					{...register('email')}
					type="email"
					placeholder="Your email"
					className="w-full px-4 py-3 border-gray-300 dark:border-gray-700 rounded-lg"
				/>
				{errors.email && (
					<p className="mt-1 text-sm text-red-500">{errors.email.message as string}</p>
				)}
			</div>

			<div>
				<Textarea
					{...register('message')}
					placeholder="Your message"
					className="w-full px-4 py-3 border-gray-300 dark:border-gray-700 rounded-lg min-h-[150px]"
				/>
				{errors.message && (
					<p className="mt-1 text-sm text-red-500">{errors.message.message as string}</p>
				)}
			</div>

			<Button
				type="submit"
				disabled={isSubmitting}
				className="w-full bg-black text-white hover:bg-gray-800 px-8 py-3 rounded-lg"
			>
				{isSubmitting ? 'Sending...' : 'Send Message'}
			</Button>

			{contactStatus.message && (
				<div
					className={`mt-4 rounded-md p-4 ${
						contactStatus.success
							? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
							: 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
					}`}
				>
					{contactStatus.message}
				</div>
			)}
		</form>
	)
}
