import type { Metadata, Viewport } from "next";
import { Figtree, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Admin" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${jetbrainsMono.variable} h-full antialiased`}
      // The script below may set data-sidebar before React hydrates.
      suppressHydrationWarning
    >
      <head>
        {/* Restores a collapsed sidebar before first paint, so the
            prerendered shell doesn't flash open (sidebar-toggle.tsx). */}
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: a fixed string, no user input
          dangerouslySetInnerHTML={{
            __html: `try{localStorage.getItem("sidebar")==="collapsed"&&(document.documentElement.dataset.sidebar="collapsed")}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full font-sans">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
