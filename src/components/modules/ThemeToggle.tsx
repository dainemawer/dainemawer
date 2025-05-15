'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      className="cursor-pointer"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <Sun strokeWidth={1.5} className="w-5 h-5" />
      ) : (
        <Moon strokeWidth={1.5} className="w-5 h-5" />
      )}
    </button>
  );
}
