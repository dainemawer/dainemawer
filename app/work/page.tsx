import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ExternalLink, Calendar, User } from "lucide-react"
import Link from "next/link"

export default function WorkArchivePage() {
  return (
    <>

      {/* Work Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Work</h1>
        <p className="text-xl text-gray-600">
          Frontend engineering projects, design systems, and team leadership initiatives that have scaled organizations
          and improved developer experience.
        </p>
      </section>

      {/* Filter Tags */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="rounded-full border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
          >
            All Projects
          </Button>
          <Button variant="outline" className="rounded-full">
            Design Systems
          </Button>
          <Button variant="outline" className="rounded-full">
            Frontend Architecture
          </Button>
          <Button variant="outline" className="rounded-full">
            Team Leadership
          </Button>
          <Button variant="outline" className="rounded-full">
            Performance
          </Button>
        </div>
      </section>

      {/* Featured Work */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Large featured project */}
          <div className="bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-2xl overflow-hidden relative h-80 group">
            <Link href="/work/enterprise-design-system">
              <div className="absolute inset-0 p-8 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full">
                    Design Systems
                  </span>
                  <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <h3 className="text-white text-2xl font-bold mb-2">Enterprise Design System</h3>
                  <p className="text-white/90 text-sm mb-3">
                    Scaled component library serving 50+ teams across multiple products
                  </p>
                  <div className="flex items-center text-white/80 text-sm">
                    <User className="w-4 h-4 mr-2" />
                    <span className="mr-4">TechCorp</span>
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>2024</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Second featured project */}
          <div className="bg-gradient-to-br from-teal-400 via-teal-500 to-blue-500 rounded-2xl overflow-hidden relative h-80 group">
            <Link href="/work/performance-optimization">
              <div className="absolute inset-0 p-8 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full">Performance</span>
                  <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <h3 className="text-white text-2xl font-bold mb-2">Performance Optimization</h3>
                  <p className="text-white/90 text-sm mb-3">
                    Reduced load times by 60% and improved Core Web Vitals across platform
                  </p>
                  <div className="flex items-center text-white/80 text-sm">
                    <User className="w-4 h-4 mr-2" />
                    <span className="mr-4">StartupCo</span>
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>2023</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* All Projects */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">All Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-orange-200 via-orange-300 to-pink-300 rounded-2xl overflow-hidden relative h-64 group"
            >
              <Link href={`/work/project-${i + 1}`}>
                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full">
                      Frontend Architecture
                    </span>
                    <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <h3 className="text-white text-xl font-bold mb-2">Micro-Frontend Migration</h3>
                    <p className="text-white/90 text-sm mb-3">
                      Migrated monolithic frontend to scalable micro-frontend architecture
                    </p>
                    <div className="flex items-center text-white/80 text-xs">
                      <User className="w-3 h-3 mr-1" />
                      <span className="mr-3">Enterprise Inc</span>
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>2023</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter Section */}
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
    </>
  )
}
