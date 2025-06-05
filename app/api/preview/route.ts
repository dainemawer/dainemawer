import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams
	const slug = searchParams.get('slug')
	const secret = searchParams.get('secret')

	// Check the secret and next parameters
	// This secret should only be known to this API route and the CMS
	if (secret !== process.env.CONTENTFUL_PREVIEW_SECRET) {
		return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
	}

	// Enable Preview Mode by setting the cookies
	const response = NextResponse.redirect(new URL(`/${slug}`, request.url))
	response.cookies.set('preview', 'true', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
	})

	return response
}
