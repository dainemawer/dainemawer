import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageShell } from "@/components/page-shell";
import { Toc } from "@/components/toc";
import { formatArticleDate } from "@/lib/format";
import { usesReviewedOn, usesSections } from "@/lib/uses";

export const metadata: Metadata = {
  title: "Uses",
  description: "The hardware and software I actually open every day, and why.",
  alternates: {
    canonical: "/uses",
    types: { "text/markdown": "/uses.md" },
  },
};

export default function UsesPage() {
  const reviewed = formatArticleDate(usesReviewedOn);

  return (
    <PageShell
      sidebar={
        <Toc
          heading="On this page"
          ariaLabel="On this page"
          items={usesSections.map((section) => ({
            id: section.id,
            label: section.label,
          }))}
          sticky
        />
      }
    >
      <div className="mx-auto max-w-content">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Uses" }]} />

        <h1 className="mt-4.5 text-2xl text-ink tracking-tight">Uses</h1>
        <div className="mt-2 text-md text-muted text-pretty">
          The hardware and software I actually open every day, and why.
        </div>
        <div className="mt-5 flex items-baseline gap-x-2 text-sm text-muted">
          <span>
            Reviewed {reviewed.day} {reviewed.month} {reviewed.year}
          </span>
          <span className="text-divider">|</span>
          <span>No affiliate links</span>
        </div>

        <div className="mt-15 flex flex-col gap-11">
          {usesSections.map((section) => (
            <div
              key={section.id}
              className="grid grid-cols-1 gap-x-12 gap-y-2 sm:grid-cols-meta sm:items-start sm:gap-y-0"
            >
              <h2
                id={section.id}
                className="scroll-mt-10 font-normal text-faint text-sm sm:text-right"
              >
                {section.label}
              </h2>
              <ul className="flex flex-col gap-5 text-base text-ink leading-normal">
                {section.items.map((item) => (
                  <li
                    key={item.name}
                    className="grid grid-cols-1 gap-x-8 gap-y-0.5 sm:grid-cols-subrow sm:items-baseline sm:gap-y-0"
                  >
                    <div className="font-medium">{item.name}</div>
                    <div className="text-muted">{item.description}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
