import Link from 'next/link';
import { sanityFetch } from '@/lib/sanity/client/live';
import { settingsQuery } from '@/lib/sanity/queries/queries';
import Logo from '../icons/Logo';
import NavBar from './NavBar';
import ThemeToggle from '../modules/ThemeToggle';
import { Search, Rss } from 'lucide-react';

export default async function Header() {
  const { data: settings } = await sanityFetch({
    query: settingsQuery,
  });

  if (!settings) {
    return null;
  }

  return (
    <header className="bg-white dark:bg-black text-gray-800 dark:text-white py-10 relative">
      <div className="container max-w-7xl mx-auto px-4 flex justify-around items-center">
        <div className="flex items-center space-x-4">
          {typeof settings.title !== undefined && (
            <Link className="flex items-center space-x-4" href="/">
              <Logo />
            </Link>
          )}
        </div>
        <NavBar menuItems={settings.menu || []} />
        <ul className="flex items-center space-x-4">
          <li className="leading-none">
            <Link href="/rss">
              <Rss strokeWidth={1.5} className="w-5 h-5" />
            </Link>
          </li>
          <li className="leading-none">
            <ThemeToggle />
          </li>
          <li className="leading-none">
            <button type="button" className="cursor-pointer">
              <Search strokeWidth={1.5} className="w-5 h-5" />
            </button>
          </li>
        </ul>
      </div>
    </header>
  );
}
