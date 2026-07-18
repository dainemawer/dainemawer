import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dainemawer.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Daine Mawer — Staff Engineer, Building with AI",
    template: "%s — Daine Mawer",
  },
  description:
    "I build and ship AI-powered products using Next.js, TypeScript, Supabase, Vercel, and Expo.",
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Daine Mawer — Staff Engineer, Building with AI",
    description:
      "I build and ship AI-powered products using Next.js, TypeScript, Supabase, Vercel, and Expo.",
    siteName: "Daine Mawer",
  },
  twitter: {
    card: "summary_large_image",
    title: "Daine Mawer — Staff Engineer, Building with AI",
    description:
      "I build and ship AI-powered products using Next.js, TypeScript, Supabase, Vercel, and Expo.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg font-sans text-white">
        {children}
      </body>
    </html>
  );
}
