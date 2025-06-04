import DefaultPageTemplate from "@/components/layout/template"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  return (
    <DefaultPageTemplate
      title="About"
      subtitle="Frontend engineering leader with 10+ years scaling teams, systems, and developer experience at high-growth companies."
      currentPage="about"
      showNewsletter={true}
    >
      {/* Page Content */}
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Building Frontend Systems That Scale</h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              I&apos;m Dave Merner, a frontend engineering leader who&apos;s spent the last decade helping companies scale their
              frontend architecture, design systems, and engineering teams.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              From early-stage startups to enterprise organizations, I&apos;ve led teams through complex technical challenges
              while maintaining focus on developer experience and business outcomes.
            </p>
            <Button className="bg-black text-white hover:bg-gray-800 px-8 py-3 rounded-full">Work With Me</Button>
          </div>
          <div className="bg-gray-200 rounded-2xl h-96 flex items-center justify-center">
            <span className="text-gray-500">Profile Image</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">10+</div>
            <div className="text-gray-600">Years Experience</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">50+</div>
            <div className="text-gray-600">Teams Led</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">100M+</div>
            <div className="text-gray-600">Users Served</div>
          </div>
        </div>

        <div className="prose prose-lg max-w-none">
          <h2>My Approach</h2>
          <p>
            I believe great frontend architecture isn&apos;t just about choosing the right framework or writing clean code.
            It&apos;s about creating systems that empower teams to move fast while maintaining quality, accessibility, and
            performance.
          </p>

          <h3>What I Focus On</h3>
          <ul>
            <li>
              <strong>Scalable Design Systems:</strong> Component libraries that grow with your team
            </li>
            <li>
              <strong>Developer Experience:</strong> Tooling and processes that reduce friction
            </li>
            <li>
              <strong>Performance:</strong> Fast, accessible experiences for all users
            </li>
            <li>
              <strong>Team Leadership:</strong> Building and mentoring high-performing frontend teams
            </li>
          </ul>
        </div>
      </div>
    </DefaultPageTemplate>
  )
}
