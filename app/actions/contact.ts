'use server'

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface ContactFormData {
	name: string
	email: string
	message: string
}

export async function sendContactMessage(data: ContactFormData) {
	try {
		if (!process.env.RESEND_API_KEY) {
			throw new Error('RESEND_API_KEY is not configured')
		}

		await resend.emails.send({
			from: 'Contact Form <hello@dainemawer.com>',
			to: 'hello@dainemawer.com',
			subject: `New Contact Form Submission from ${data.name}`,
			replyTo: data.email,
			text: `
Name: ${data.name}
Email: ${data.email}

Message:
${data.message}
			`,
		})

		return { success: true }
	} catch (error) {
		console.error('Error sending contact message:', error)
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to send message',
		}
	}
}
