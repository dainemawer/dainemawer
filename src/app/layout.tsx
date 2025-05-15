/**
 * Do not import Sanity or front-end specific code into this
 * file, it will not be tree shaken effectively across routes
 */

import { Public_Sans } from 'next/font/google';

const publicSans = Public_Sans({
  variable: '--font-public-sans',
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${publicSans.variable}`} suppressHydrationWarning>
      {children}
    </html>
  );
}
