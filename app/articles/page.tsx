import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function BlogPage() {
  return (
    <>

      {/* Blog Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Blog</h1>
        <p className="text-xl text-gray-600">
          Real-world writing on frontend leadership, scalable UI systems, and developer experience.
        </p>
      </section>

      {/* Featured Articles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Large featured article - spans 2 columns */}
          <div className="md:col-span-2 bg-gradient-to-br from-teal-200 via-teal-300 to-blue-300 rounded-2xl overflow-hidden relative h-80">
            <Link href="/blog/how-i-lead-frontend-kickoffs">
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <span className="text-white text-sm font-medium mb-2">Design</span>
                <h3 className="text-white text-2xl font-bold">How I Lead Frontend Kickoffs on Enterprise Projects</h3>
              </div>
            </Link>
          </div>

          {/* Right column with 2 smaller articles */}
          <div className="flex flex-col space-y-6">
            {/* Top right article */}
            <div className="bg-gradient-to-br from-orange-200 via-orange-300 to-pink-300 rounded-2xl overflow-hidden relative h-[9.5rem]">
              <Link href="/blog/scaling-design-systems">
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <span className="text-white text-sm font-medium mb-1">Design</span>
                  <h3 className="text-white text-xl font-bold">Scaling Design Systems Without Slowing Down</h3>
                </div>
              </Link>
            </div>

            {/* Bottom right articles */}
            <div className="grid grid-cols-2 gap-6">
              {/* Bottom left article */}
              <div className="bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-2xl overflow-hidden relative h-[9.5rem]">
                <Link href="/blog/frontend-architecture-dx">
                  <div className="absolute inset-0 p-4 flex flex-col justify-end">
                    <span className="text-white text-xs font-medium mb-1">Design</span>
                    <h3 className="text-white text-sm font-bold">Frontend Architecture for DX and Performance</h3>
                  </div>
                </Link>
              </div>

              {/* Bottom right article */}
              <div className="bg-gradient-to-br from-yellow-200 via-yellow-300 to-orange-300 rounded-2xl overflow-hidden relative h-[9.5rem]">
                <Link href="/blog/principles-of-a-principal">
                  <div className="absolute inset-0 p-4 flex flex-col justify-end">
                    <span className="text-white text-xs font-medium mb-1">Design</span>
                    <h3 className="text-white text-sm font-bold">Principles of a Principal: Leading by Example</h3>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More Articles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">More Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-2xl overflow-hidden relative h-48"
            >
              <Link href={`/blog/frontend-architecture-${i + 1}`}>
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <span className="text-white text-sm font-medium mb-2">Design</span>
                  <h3 className="text-white text-xl font-bold">Frontend Architecture for DX and Performance</h3>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center space-x-2 mt-12">
          <Link
            href="/blog"
            className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="sr-only">Previous page</span>
          </Link>
          <Link
            href="/blog?page=1"
            className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            1
          </Link>
          <Link
            href="/blog?page=2"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-900 text-white"
          >
            2
          </Link>
          <Link
            href="/blog?page=3"
            className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            3
          </Link>
          <Link
            href="/blog?page=4"
            className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            4
          </Link>
          <Link
            href="/blog?page=5"
            className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            5
          </Link>
          <span className="text-gray-600">...</span>
          <Link
            href="/blog?page=14"
            className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            14
          </Link>
          <Link
            href="/blog?page=3"
            className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            <ArrowRight className="w-4 h-4" />
            <span className="sr-only">Next page</span>
          </Link>
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
