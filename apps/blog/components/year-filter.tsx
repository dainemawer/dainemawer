import Link from "next/link";
import { getYears } from "@/lib/posts";

// "All" is the unfiltered, paginated index at / — it has to read as
// selected there, or the sidebar claims a year filter the list isn't
// applying.
export function YearFilter({ selected }: { selected?: number }) {
  const years = getYears();
  const items = [
    { label: "All", href: "/", isActive: !selected },
    ...years.map((year) => ({
      label: String(year),
      href: selected === year ? "/" : `/?year=${year}`,
      isActive: selected === year,
    })),
  ];

  return (
    <nav aria-label="Years" className="flex flex-row items-start md:flex-col">
      <ul className="flex flex-row flex-wrap gap-x-5 gap-y-2 md:flex-col md:items-start md:gap-6.5">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              aria-current={item.isActive ? "page" : undefined}
              className={`cursor-pointer font-medium text-sm transition-colors duration-140 ease-out hover:text-ink focus-visible:text-ink md:[writing-mode:vertical-rl] md:[transform:rotate(180deg)] ${item.isActive ? "text-ink" : "text-muted"}`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
