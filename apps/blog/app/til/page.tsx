import type { Metadata } from "next";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { Breadcrumb } from "@/components/breadcrumb";
import { JsonLd } from "@/components/json-ld";
import { getMdxComponents } from "@/components/mdx-components";
import { PageShell } from "@/components/page-shell";
import { formatPostDate } from "@/lib/format";
import { tilCollectionSchema } from "@/lib/schema";
import {
  getAllTils,
  getTilContent,
  groupTilsByYear,
  TIL_DESCRIPTION,
} from "@/lib/til";

const mdxOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [rehypeSlug],
};

export const metadata: Metadata = {
  title: "TIL",
  description: TIL_DESCRIPTION,
  alternates: {
    canonical: "/til",
    types: {
      "text/markdown": "/til.md",
      "application/rss+xml": "/til/rss.xml",
    },
  },
};

export default function TilIndexPage() {
  const tils = getAllTils();
  const years = groupTilsByYear(tils);

  return (
    <PageShell
      sidebar={
        <nav aria-label="Years" className="flex flex-col gap-3.5 md:pr-10">
          <div className="mb-1 text-faint text-xs">Archive</div>
          <ul className="flex flex-row flex-wrap gap-x-4 gap-y-2 md:flex-col md:gap-3.5">
            {years.map(({ year }) => (
              <li key={year} className="text-sm">
                <a
                  href={`#${year}`}
                  className="text-muted hover:text-ink focus-visible:text-ink"
                >
                  {year}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      }
    >
      <JsonLd
        schema={tilCollectionSchema({
          name: "Today I Learned",
          description: TIL_DESCRIPTION,
          tils,
        })}
      />
      <div className="mx-auto max-w-content">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "TIL" }]} />

        <h1 className="mt-4.5 text-2xl text-ink tracking-tight">
          Today I Learned
        </h1>
        <div className="mt-2 text-md text-muted text-pretty">
          {TIL_DESCRIPTION}
        </div>

        <div className="mt-15 flex flex-col gap-16">
          {years.map(({ year, tils: entries }) => (
            <section key={year} id={String(year)} className="scroll-mt-10">
              <h2 className="text-faint text-sm font-normal">{year}</h2>
              <ul className="mt-6 flex flex-col gap-14">
                {entries.map((til) => {
                  const content = getTilContent(til.slug);
                  return (
                    <li key={til.slug}>
                      <article className="flex flex-col gap-4">
                        <header className="flex flex-col gap-1">
                          <h3 className="text-xl font-medium text-ink tracking-tight text-pretty">
                            <Link
                              href={`/til/${til.slug}`}
                              className="hover:opacity-60 focus-visible:opacity-60"
                            >
                              {til.title}
                            </Link>
                          </h3>
                          <div className="flex flex-wrap items-baseline gap-x-2 text-sm text-muted">
                            <time dateTime={til.date}>
                              {formatPostDate(til.date)}
                            </time>
                            {til.tags.map((tag) => (
                              <span key={tag} className="text-faint">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </header>
                        {content && (
                          <div className="flex max-w-[68ch] flex-col gap-4 text-md text-ink leading-relaxed">
                            <MDXRemote
                              source={content.rawBody}
                              components={getMdxComponents(`til-${til.slug}`)}
                              options={{ mdxOptions }}
                            />
                          </div>
                        )}
                      </article>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
