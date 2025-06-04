import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ReactNode } from "react"

interface DefaultPageTemplateProps {
  title: string
  subtitle?: string
  showNewsletter?: boolean
  children: ReactNode
  currentPage?: string
}

export default function DefaultPageTemplate({
  title,
  subtitle,
  showNewsletter = true,
  children,
}: DefaultPageTemplateProps) {
  return (
    <>

      {/* Page Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">{title}</h1>
          {subtitle && <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">{subtitle}</p>}
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">{children}</main>

      {/* Newsletter Section */}
      {showNewsletter && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Stay Ahead Of The Curve</h2>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              I share real-world lessons on frontend systems, team leadership, and scalable strategy — straight from the
              trenches.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-4">
              <Input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 border-gray-300 rounded-full"
              />
              <Button className="bg-black text-white hover:bg-gray-800 px-8 py-3 whitespace-nowrap rounded-full">
                Sign Up
              </Button>
            </div>

            <p className="text-sm text-gray-500">You&apos;ll hear from me just once a month — no fluff, no spam.</p>
          </div>
        </section>
      )}
    </>
  )
}
