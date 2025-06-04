'use server'

import { Resend } from 'resend'
import * as z from 'zod'

const newsletterSchema = z.object({
	email: z.string().email('Please enter a valid email address'),
})

const resend = new Resend(process.env.RESEND_API_KEY)
const audienceId = process.env.RESEND_AUDIENCE_ID as string

if (!audienceId) {
	throw new Error('RESEND_AUDIENCE_ID is not defined')
}

export async function subscribeToNewsletter(data: { email: string }) {
	try {
		// Validate the email
		const validatedData = newsletterSchema.parse(data)

		// Add the contact to the audience
		const { data: audienceData, error } = await resend.contacts.create({
			email: validatedData.email,
			audienceId,
			unsubscribed: false,
		})

		if (error) {
			return { success: false, error: 'Failed to subscribe to newsletter' }
		}

		// Send welcome email
		await resend.emails.send({
			from: 'Newsletter <onboarding@resend.dev>', // Update this with your verified domain
			to: validatedData.email,
			subject: 'Welcome to the Newsletter!',
			text: `Thanks for subscribing to my newsletter! I'll be sharing insights about frontend systems, team leadership, and scalable strategy.`,
		})

		return { success: true, data: audienceData }
	} catch (error) {
		if (error instanceof Error) {
			return { success: false, error: error.message }
		}
		return { success: false, error: 'Something went wrong' }
	}
}
