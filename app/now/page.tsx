import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { MetaRow } from "@/components/meta-row";
import { PageShell } from "@/components/page-shell";
import { PostListItem } from "@/components/post-list-item";
import { now } from "@/lib/now";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Now",
  description:
    "What has my attention this month, kept honest by a visible date.",
  alternates: {
    canonical: "/now",
    types: { "text/markdown": "/now.md" },
  },
};

export default function NowPage() {
  const [latest] = getAllPosts();

  return (
    <PageShell
      sidebar={
        <nav aria-label="Archive" className="flex flex-col gap-3.5 md:pr-10">
          <div className="mb-1 text-faint text-xs">Previously</div>
          <ul className="flex flex-row flex-wrap gap-x-4 gap-y-2 md:flex-col md:gap-3.5">
            {now.archive.map((entry, index) => (
              <li
                key={entry}
                className={`text-sm ${index === 0 ? "text-ink" : "text-muted"}`}
              >
                {entry}
              </li>
            ))}
          </ul>
        </nav>
      }
    >
      <div className="mx-auto max-w-content">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Now" }]} />

        <h1 className="mt-4.5 text-2xl text-ink tracking-tight">Now</h1>
        <div className="mt-2 text-md text-muted text-pretty">
          What has my attention this month, kept honest by a visible date.
        </div>
        <div className="mt-5 flex items-baseline gap-x-2 text-sm text-muted">
          <span>
            Updated {now.updated.day} {now.updated.month}{" "}
            <span className="text-faint">{now.updated.year}</span>
          </span>
          <span className="text-divider">|</span>
          <span>Cape Town, GMT+2</span>
        </div>

        <div className="mt-15 flex flex-col gap-10">
          {now.entries.map((entry) => (
            <MetaRow key={entry.label} label={entry.label}>
              <p className="text-md text-ink leading-relaxed text-pretty">
                {entry.body}
              </p>
            </MetaRow>
          ))}

          {latest && (
            <MetaRow label="Latest">
              <PostListItem post={latest} headingLevel="h3" />
            </MetaRow>
          )}
        </div>
      </div>
    </PageShell>
  );
}
