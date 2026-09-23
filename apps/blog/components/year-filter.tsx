import Link from "next/link";
import { getYears } from "@/lib/posts";

export function YearFilter({ selected }: { selected?: number }) {
  const years = getYears();
  const latest = years[0];

  return (
    <nav aria-label="Years" className="flex flex-row items-start md:flex-col">
      <ul className="flex flex-row flex-wrap gap-x-5 gap-y-2 md:flex-col md:items-start md:gap-6.5">
        {years.map((year) => {
          const isActive = selected ? selected === year : year === latest;
          return (
            <li key={year}>
              <Link
                href={selected === year ? "/" : `/?year=${year}`}
                aria-current={isActive ? "page" : undefined}
                className={`cursor-pointer font-medium text-sm transition-colors duration-140 ease-out hover:text-ink focus-visible:text-ink md:[writing-mode:vertical-rl] md:[transform:rotate(180deg)] ${isActive ? "text-ink" : "text-muted"}`}
              >
                {year}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
