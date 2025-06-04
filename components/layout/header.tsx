import { Rss } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Search } from "@/components/search"

export default function Header() {
    return (
        <header className="border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-lg">M</div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 font-medium">
                Home
              </Link>
              <Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium">
                About
              </Link>
              <Link href="/work" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium">
                Work
              </Link>
              <Link href="/articles" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium">
                Articles
              </Link>
              <Link href="/contact" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium">
                Contact
              </Link>
            </nav>

            {/* Right side icons */}
            <div className="flex items-center space-x-4">
              <Link href="/feed.xml" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                <Rss className="w-5 h-5" />
              </Link>
              <ThemeToggle />
              <Search />
            </div>
          </div>
        </div>
      </header>
    )
}
