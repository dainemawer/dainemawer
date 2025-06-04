import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Main from "@/components/layout/main";
import Script from "next/script";
import { Analytics } from '@vercel/analytics/react';
import SkipLink from "@/components/layout/skip-link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	metadataBase: new URL('https://dainemawer.com'),
	title: {
		default: 'Daine Mawer | Frontend Engineering Leader',
		template: '%s | Daine Mawer',
	},
	description: 'Frontend Engineering Leader specializing in scaling teams, systems, and strategy for modern web applications.',
	authors: [{ name: 'Daine Mawer' }],
	creator: 'Daine Mawer',
	openGraph: {
		type: 'website',
		locale: 'en_AU',
		url: 'https://dainemawer.com',
		title: 'Daine Mawer | Frontend Engineering Leader',
		description: 'Frontend Engineering Leader specializing in scaling teams, systems, and strategy for modern web applications.',
		siteName: 'Daine Mawer',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Daine Mawer | Frontend Engineering Leader',
		description: 'Frontend Engineering Leader specializing in scaling teams, systems, and strategy for modern web applications.',
		creator: '@dainemawer',
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
	icons: {
		icon: '/favicon.ico',
		shortcut: '/favicon-16x16.png',
		apple: '/apple-touch-icon.png',
	},
	manifest: '/site.webmanifest',
};

const jsonLd = {
	"@context": "https://schema.org",
	"@type": "Organization",
	"name": "Daine Mawer",
	"url": "https://dainemawer.com",
	"logo": "https://dainemawer.com/logo.png",
	"sameAs": [
		"https://twitter.com/dainemawer",
		"https://github.com/dainemawer",
		"https://linkedin.com/in/dainemawer"
	],
	"description": "Frontend Engineering Leader specializing in scaling teams, systems, and strategy for modern web applications.",
	"address": {
		"@type": "PostalAddress",
		"addressLocality": "Melbourne",
		"addressCountry": "AU"
	}
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<Script
					id="organization-schema"
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				/>
			</head>
			<body className={`${inter.className} min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<SkipLink />
					<Header />
					<Main>
						{children}
					</Main>
					<Footer />
					<Analytics />
				</ThemeProvider>
			</body>
		</html>
	);
}
