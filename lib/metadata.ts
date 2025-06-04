export function getCanonicalUrl(path: string = '') {
	const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dainemawer.com'
	return `${baseUrl}${path}`
}

export function generatePageMetadata({
	title,
	description,
	path,
	image,
}: {
	title: string
	description: string
	path?: string
	image?: string
}) {
	const canonicalUrl = getCanonicalUrl(path)
	const ogImage = image || '/og-image.jpg'

	return {
		title,
		description,
		alternates: {
			canonical: canonicalUrl,
		},
		openGraph: {
			title,
			description,
			url: canonicalUrl,
			images: [
				{
					url: ogImage,
					width: 1200,
					height: 630,
					alt: title,
				},
			],
		},
		twitter: {
			title,
			description,
			images: [ogImage],
		},
	}
}
