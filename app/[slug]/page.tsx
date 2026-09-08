import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { Breadcrumb } from "@/components/breadcrumb";
import { DirectionalTransition } from "@/components/directional-transition";
import { JsonLd } from "@/components/json-ld";
import { getMdxComponents } from "@/components/mdx-components";
import { MetaRow } from "@/components/meta-row";
import { PageShell } from "@/components/page-shell";
import { ReadingProgress } from "@/components/reading-progress";
import { ShareLinks } from "@/components/share-links";
import { Toc } from "@/components/toc";
import { formatArticleDate } from "@/lib/format";
import { renderInlineText } from "@/lib/inline-markdown";
import { getPostContent } from "@/lib/mdx";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { articleSchema, faqPageSchema } from "@/lib/schema";
import { site } from "@/lib/site";
import { getTopicBySlug } from "@/lib/topics";

const mdxOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [rehypeSlug],
};

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  props: PageProps<"/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    // absolute: bypasses the "%s — Daine Mawer" template. Most titles are
    // already close to the SERP truncation point on their own; appending
    // the site name would push several of them past it.
    title: { absolute: post.title },
    description: post.dek,
    alternates: {
      canonical: `/${slug}`,
      types: { "text/markdown": `/${slug}.md` },
    },
  };
}

export default async function ArticlePage(props: PageProps<"/[slug]">) {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);
  const content = getPostContent(slug);

  if (!post || !content) notFound();

  const published = formatArticleDate(post.date);
  const updated = post.updated ? formatArticleDate(post.updated) : undefined;
  const topic = post.topics[0] ? getTopicBySlug(post.topics[0]) : undefined;

  return (
    <>
      {/* Rendered outside DirectionalTransition's ViewTransition boundary —
          fixed position content shouldn't slide with the page transition. */}
      <ReadingProgress />
      <DirectionalTransition vtKey={slug}>
        <JsonLd
          schema={
            content.faq.length > 0
              ? [articleSchema(post, content), faqPageSchema(content.faq)]
              : articleSchema(post, content)
          }
        />
        <PageShell
          sidebar={
            // One sticky unit so Share scrolls and pins together with the
            // ToC above it — sticky lives on this wrapper rather than on
            // Toc itself, since Toc is also used unstuck on /uses.
            <div className="flex flex-col gap-8 md:sticky md:top-10 md:self-start">
              <Toc
                heading="On this page"
                ariaLabel="On this page"
                items={content.toc}
              />
              <ShareLinks title={post.title} url={`${site.url}/${slug}`} />
            </div>
          }
        >
          <div className="mx-auto max-w-content">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                ...(topic
                  ? [{ label: topic.name, href: `/topics/${topic.slug}` }]
                  : []),
              ]}
            />

            <h1 className="mt-4.5 text-2xl text-ink tracking-tight text-pretty">
              {post.title}
            </h1>
            <div className="mt-2 text-md text-muted text-pretty">
              {post.dek}
            </div>

            <div className="mt-5 flex flex-wrap items-baseline gap-x-2 text-sm text-muted">
              <Link
                href="/about"
                className="text-ink transition-opacity duration-140 ease-out hover:opacity-60 focus-visible:opacity-60"
              >
                {site.name}
              </Link>
              <span className="text-divider">|</span>
              <time dateTime={post.date}>
                {published.day} {published.month}{" "}
                <span className="text-faint">{published.year}</span>
              </time>
              {updated && (
                <>
                  <span className="text-divider">|</span>
                  <span>
                    Updated{" "}
                    <time dateTime={post.updated}>
                      {updated.day} {updated.month}{" "}
                      <span className="text-faint">{updated.year}</span>
                    </time>
                  </span>
                </>
              )}
              <span className="text-divider">|</span>
              <span>{post.readTime}</span>
              <span className="text-divider">|</span>
              <span>{post.wordCount.toLocaleString()} words</span>
            </div>

            <div className="mt-13">
              <MetaRow label="The short answer">
                <p className="text-md text-ink leading-relaxed text-pretty">
                  {renderInlineText(content.shortAnswer)}
                </p>
              </MetaRow>
            </div>

            <div className="mt-15 flex flex-col gap-6.5 text-md text-ink leading-relaxed">
              <MDXRemote
                source={content.rawBody}
                components={getMdxComponents(slug)}
                options={{ mdxOptions }}
              />

              {content.related && (
                <aside
                  aria-label="Related article"
                  className="my-6.5 grid grid-cols-1 gap-x-12 gap-y-1 text-muted text-sm sm:grid-cols-meta sm:items-baseline sm:gap-y-0"
                >
                  <div className="text-faint sm:text-right">Related</div>
                  <Link
                    href={content.related.href}
                    className="hover:text-ink focus-visible:text-ink"
                  >
                    {content.related.label}
                  </Link>
                </aside>
              )}
            </div>

            {content.takeaways.length > 0 && (
              <div id="takeaways" className="mt-18 scroll-mt-10">
                <MetaRow label="Takeaways">
                  <ol className="flex list-decimal flex-col gap-3 pl-5.5 text-base text-ink leading-normal text-pretty">
                    {content.takeaways.map((takeaway) => (
                      <li key={takeaway.slice(0, 40)}>
                        {renderInlineText(takeaway)}
                      </li>
                    ))}
                  </ol>
                </MetaRow>
              </div>
            )}

            {content.faq.length > 0 && (
              <div id="faq" className="mt-18 scroll-mt-10">
                <MetaRow label="Questions">
                  <div className="flex flex-col gap-7">
                    {content.faq.map((item) => (
                      <div
                        key={item.question}
                        className="flex flex-col gap-1.5"
                      >
                        <h3 className="text-base text-ink">
                          {renderInlineText(item.question)}
                        </h3>
                        <p className="text-base text-muted leading-normal text-pretty">
                          {renderInlineText(item.answer)}
                        </p>
                      </div>
                    ))}
                  </div>
                </MetaRow>
              </div>
            )}

            <nav
              aria-label="Post navigation"
              className="mt-19 grid grid-cols-2 gap-x-12 text-sm text-muted"
            >
              {content.prev && (
                <Link
                  href={content.prev.href}
                  transitionTypes={["sequence-prev"]}
                  className="hover:text-ink focus-visible:text-ink"
                >
                  {content.prev.label}
                </Link>
              )}
              {content.next && (
                <Link
                  href={content.next.href}
                  transitionTypes={["sequence-next"]}
                  className="text-right hover:text-ink focus-visible:text-ink"
                >
                  {content.next.label}
                </Link>
              )}
            </nav>
          </div>
        </PageShell>
      </DirectionalTransition>
    </>
  );
}
