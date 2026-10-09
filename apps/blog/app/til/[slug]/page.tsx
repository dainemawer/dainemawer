import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { Breadcrumb } from "@/components/breadcrumb";
import { JsonLd } from "@/components/json-ld";
import { getMdxComponents } from "@/components/mdx-components";
import { PageShell } from "@/components/page-shell";
import { ShareLinks } from "@/components/share-links";
import { formatArticleDate } from "@/lib/format";
import { tilSchema } from "@/lib/schema";
import { site } from "@/lib/site";
import { getAllTils, getTilBySlug, getTilContent } from "@/lib/til";

const mdxOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [rehypeSlug],
};

export function generateStaticParams() {
  return getAllTils().map((til) => ({ slug: til.slug }));
}

export async function generateMetadata(
  props: PageProps<"/til/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const til = getTilBySlug(slug);
  if (!til) return {};
  return {
    title: `TIL: ${til.title}`,
    // A TIL has no dek; the note is short enough that its own opening is
    // the right description.
    description: `Today I learned: ${til.title}.`,
    alternates: {
      canonical: `/til/${slug}`,
      types: { "text/markdown": `/til/${slug}.md` },
    },
    openGraph: {
      type: "article",
      url: `${site.url}/til/${slug}`,
      siteName: site.name,
      locale: "en_US",
      publishedTime: til.date,
      authors: [site.url],
      tags: til.tags,
    },
  };
}

export default async function TilPage(props: PageProps<"/til/[slug]">) {
  const { slug } = await props.params;
  const til = getTilBySlug(slug);
  const content = getTilContent(slug);

  if (!til || !content) notFound();

  const published = formatArticleDate(til.date);
  const words = content.rawBody.trim().split(/\s+/).filter(Boolean).length;

  return (
    <PageShell
      sidebar={
        <div className="flex flex-col gap-8 md:sticky md:top-10 md:self-start">
          <ShareLinks title={til.title} url={`${site.url}/til/${slug}`} />
        </div>
      }
    >
      <JsonLd schema={tilSchema(til, words)} />
      <div className="mx-auto max-w-content">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "TIL", href: "/til" },
          ]}
        />

        <h1 className="mt-4.5 text-3xl text-ink tracking-tight text-pretty">
          {til.title}
        </h1>

        <div className="mt-5 flex flex-wrap items-baseline gap-x-2 text-sm text-muted">
          <Link
            href="/about"
            className="text-ink transition-opacity duration-140 ease-out hover:opacity-60 focus-visible:opacity-60"
          >
            {site.name}
          </Link>
          <span className="text-divider">|</span>
          <time dateTime={til.date}>
            {published.day} {published.month}{" "}
            <span className="text-faint">{published.year}</span>
          </time>
          {til.tags.map((tag) => (
            <span key={tag} className="text-faint">
              #{tag}
            </span>
          ))}
        </div>

        <div className="mt-15 flex max-w-[68ch] flex-col gap-6.5 text-md text-ink leading-relaxed">
          <MDXRemote
            source={content.rawBody}
            components={getMdxComponents(`til-${slug}`)}
            options={{ mdxOptions }}
          />
        </div>

        <nav aria-label="TIL navigation" className="mt-19 text-sm text-muted">
          <Link href="/til" className="hover:text-ink focus-visible:text-ink">
            All TILs
          </Link>
        </nav>
      </div>
    </PageShell>
  );
}
