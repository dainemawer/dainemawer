"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import type { Topic } from "@/lib/topics";

export function TopicFilterNav({
  topics,
  activeSlug,
}: {
  topics: readonly Topic[];
  activeSlug: string;
}) {
  return (
    <nav
      aria-label="Topics"
      className="hidden flex-col gap-3.5 md:flex md:pr-10"
    >
      <div className="mb-1 text-faint text-xs">Topics</div>
      <ul className="flex flex-col gap-3.5">
        {topics.map((t) => (
          <li key={t.slug}>
            <Link
              href={`/topics/${t.slug}`}
              aria-current={t.slug === activeSlug ? "page" : undefined}
              onClick={() =>
                trackEvent("topic_filter_selected", { topic: t.slug })
              }
              className={`text-sm transition-colors duration-140 ease-out hover:text-ink focus-visible:text-ink ${t.slug === activeSlug ? "text-ink" : "text-muted"}`}
            >
              {t.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
