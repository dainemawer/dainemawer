import Link from "next/link";
import { pagePath, pageRange } from "@/lib/pagination";

// Plain links, not a client-side "load more": every page is its own
// crawlable URL, and a crawler following Older → reaches the oldest article
// without running any JavaScript.
//
// "Newer" and "Older" rather than previous/next — on a reverse-chronological
// list, "next" could mean either direction. The transition types match:
// older content slides in like drilling down, newer like going back.
export function Pagination({
  basePath,
  page,
  totalPages,
}: {
  basePath: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const linkClass =
    "text-muted transition-colors duration-140 ease-out hover:text-ink focus-visible:text-ink";

  return (
    <nav
      aria-label="Pagination"
      className="grid grid-cols-1 gap-x-12 gap-y-3 border-divider border-t pt-7 text-sm sm:grid-cols-meta sm:items-baseline sm:gap-y-0"
    >
      <p className="text-faint sm:text-right">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-baseline justify-between gap-6">
        {/* Empty cells keep the numbers centred on the first and last page,
            where one direction has nowhere to go — omitted, not disabled,
            so there's never a link that leads nowhere. */}
        <span className="min-w-16">
          {page > 1 && (
            <Link
              href={pagePath(basePath, page - 1)}
              rel="prev"
              transitionTypes={["nav-back"]}
              className={linkClass}
            >
              <span aria-hidden="true">← </span>Newer
            </Link>
          )}
        </span>

        <ol className="hidden items-baseline gap-4 sm:flex">
          {pageRange(page, totalPages).map((item) =>
            typeof item === "string" ? (
              <li key={item} aria-hidden="true" className="text-faint">
                …
              </li>
            ) : (
              <li key={item}>
                {item === page ? (
                  <span aria-current="page" className="font-medium text-ink">
                    {item}
                  </span>
                ) : (
                  <Link
                    href={pagePath(basePath, item)}
                    aria-label={`Page ${item}`}
                    transitionTypes={[item < page ? "nav-back" : "nav-forward"]}
                    className={`${linkClass} tabular-nums`}
                  >
                    {item}
                  </Link>
                )}
              </li>
            ),
          )}
        </ol>

        <span className="min-w-16 text-right">
          {page < totalPages && (
            <Link
              href={pagePath(basePath, page + 1)}
              rel="next"
              transitionTypes={["nav-forward"]}
              className={linkClass}
            >
              Older<span aria-hidden="true"> →</span>
            </Link>
          )}
        </span>
      </div>
    </nav>
  );
}
