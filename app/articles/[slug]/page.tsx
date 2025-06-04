import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Twitter, Linkedin, Share } from "lucide-react"
import Link from "next/link"

export default function ArticlePage() {
  return (
    <>

      {/* Hero Image */}
      <div className="w-full h-80 bg-gradient-to-br from-orange-200 via-orange-300 to-yellow-200 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `url(&apos;/placeholder.svg?height=320&width=1200&apos;)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "sepia(20%) saturate(120%) hue-rotate(15deg)",
          }}
        />
      </div>

      {/* Article Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Article Meta */}
        <div className="text-center mb-8">
          <div className="text-sm text-gray-500 mb-4">
            19 February 2025 • 6 Min Read • <span className="text-orange-600">Design</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight max-w-4xl mx-auto">
            How I Lead Frontend Kickoffs on Enterprise Projects
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Table of Contents */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Table of Contents</h3>
              <nav className="space-y-3">
                <a href="#business-context" className="block text-sm text-gray-600 hover:text-gray-900">
                  1. Start With the Business Context
                </a>
                <a href="#technical-constraints" className="block text-sm text-gray-600 hover:text-gray-900">
                  2. Define Technical Constraints Early
                </a>
                <a href="#component-strategy" className="block text-sm text-gray-600 hover:text-gray-900">
                  3. Establish a Scalable Component Strategy
                </a>
                <a href="#developer-experience" className="block text-sm text-gray-600 hover:text-gray-900">
                  4. Optimize Developer Experience (DX)
                </a>
                <a href="#accessibility-performance" className="block text-sm text-gray-600 hover:text-gray-900">
                  5. Prioritize Accessibility and Performance from Day One
                </a>
              </nav>

              {/* Social Share */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex space-x-3">
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
                    <Twitter className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
                    <Linkedin className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
                    <Share className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="prose prose-lg max-w-none">
              <p className="text-xl text-gray-600 leading-relaxed mb-8">
                When you&apos;re building for scale, it&apos;s not enough to just choose a framework and start coding. You need a
                strategy that accounts for performance, developer experience, design system integration, and long-term
                maintainability. Here&apos;s how I approach frontend architecture in high-stakes environments.
              </p>

              <section id="business-context" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Start With the Business Context</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Before diving into code, I meet with product and design stakeholders to understand the business goals.
                  Are we optimizing for speed? Flexibility? A complete rebrand? The answers to everything from routing
                  strategy to component boundaries.
                </p>
              </section>

              <section id="technical-constraints" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Define Technical Constraints Early</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  What browsers do we need to support? What&apos;s our performance budget? Who&apos;s contributing to the
                  codebase? These questions help define the right tech stack and modular structure up front — saving
                  weeks of rework later.
                </p>
              </section>

              <section id="component-strategy" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Establish a Scalable Component Strategy</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  I rely on atomic or utility-first design principles depending on the org&apos;s maturity. Components are
                  built with scale and reusability in mind, documented in a living design system, and tightly integrated
                  with Figma or design tokens.
                </p>
              </section>

              <section id="developer-experience" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Optimize Developer Experience (DX)</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Tooling is often an afterthought — I treat it as a first-class concern. I set up ESLint, Prettier,
                  TypeScript, and Git hooks from day one. The goal? Reduce friction and improve code velocity with
                  minimal tech debt.
                </p>
              </section>

              <section id="accessibility-performance" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Prioritize Accessibility and Performance from Day One
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Lighthouse scores and semantic markup are baked into the workflow. I also introduce guardrails for
                  image optimization, lazy loading, and hydration strategies tailored to the framework (usually
                  React/Next.js).
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Document the Architecture</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Documentation, diagrams, and onboarding guides aren&apos;t extras — they&apos;re essential. I share
                  architectural decisions with stakeholders like a product roadmap: clear, structured, and
                  outcome-focused.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Frontend architecture isn&apos;t just about components and config files — it&apos;s about aligning technology
                  with people and product. If you&apos;re leading a team or starting a refactoring effort, keep the big
                  picture in mind: business value, developer happiness, and long-term scalability.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Want more content like this?{" "}
                  <Link href="/newsletter" className="text-blue-600 hover:text-blue-800">
                    Join my monthly newsletter
                  </Link>{" "}
                  or{" "}
                  <Link href="/contact" className="text-blue-600 hover:text-blue-800">
                    Follow me on X
                  </Link>{" "}
                  for real-world insights from the frontend trenches.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Related Articles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Related Articles</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-yellow-200 via-yellow-300 to-orange-300 rounded-2xl overflow-hidden relative h-64">
            <Link href="/blog/principles-of-a-principal">
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <h3 className="text-white text-xl font-bold">Principles of a Principal: Leading by Example.</h3>
              </div>
            </Link>
          </div>
          <div className="bg-gradient-to-br from-yellow-200 via-yellow-300 to-orange-300 rounded-2xl overflow-hidden relative h-64">
            <Link href="/blog/principles-of-a-principal-2">
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <h3 className="text-white text-xl font-bold">Principles of a Principal: Leading by Example.</h3>
              </div>
            </Link>
          </div>
          <div className="bg-gradient-to-br from-yellow-200 via-yellow-300 to-orange-300 rounded-2xl overflow-hidden relative h-64">
            <Link href="/blog/principles-of-a-principal-3">
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <h3 className="text-white text-xl font-bold">Principles of a Principal: Leading by Example.</h3>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Stay Ahead Of The Curve</h2>
          <p className="text-xl text-gray-600 mb-12">
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

    </>
  )
}
