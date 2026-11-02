import { compileMDX } from "next-mdx-remote/rsc";
import type { AnchorHTMLAttributes, ReactElement, ReactNode } from "react";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { codeToHtml } from "shiki";

// Renders a blog post's MDX the way the blog does (apps/blog/app/[slug] and
// components/mdx-components.tsx): the same plugins, the same shiki theme and
// the same element styles, minus the blog's analytics and client code.
// Keep the two in step when the blog's change. next-mdx-remote's defaults
// stay on, so JavaScript expressions in the MDX are stripped, not run.

const mdxOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [rehypeSlug],
};

type CodeElement = ReactElement<{ className?: string; children?: string }>;

async function Pre({ children }: { children: CodeElement }) {
  const lang = children.props.className?.replace("language-", "") ?? "text";
  const code = children.props.children ?? "";
  let html: string | null = null;
  try {
    html = await codeToHtml(code, { lang, theme: "min-light" });
  } catch {
    // An unknown language: show it plain rather than failing the page.
  }
  return html ? (
    <div
      translate="no"
      className="my-1.5 overflow-x-auto font-mono text-sm leading-loose [&_pre]:!bg-transparent"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output, which escapes the code it's given
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ) : (
    <pre className="my-1.5 overflow-x-auto font-mono text-sm leading-loose">
      {code}
    </pre>
  );
}

const linkClass =
  "text-ink underline decoration-divider underline-offset-2 hover:decoration-ink focus-visible:decoration-ink";

// Internal links point at the blog, not this app.
function Anchor({
  href = "",
  children,
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const url = href.startsWith("/") ? `https://www.dainemawer.com${href}` : href;
  return (
    <a href={url} target="_blank" rel="noreferrer" className={linkClass}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

const components = {
  pre: Pre,
  code: ({ children }: { children: ReactNode }) => (
    <code className="rounded bg-ink/5 px-1 py-0.5 font-mono text-ink text-sm">
      {children}
    </code>
  ),
  h2: ({ children, id }: { children: ReactNode; id?: string }) => (
    <h2 id={id} className="mt-8 scroll-mt-10 text-ink text-lg tracking-tight">
      {children}
    </h2>
  ),
  h3: ({ children, id }: { children: ReactNode; id?: string }) => (
    <h3 id={id} className="mt-6 scroll-mt-10 text-ink text-base tracking-tight">
      {children}
    </h3>
  ),
  p: ({ children }: { children: ReactNode }) => (
    <p className="text-pretty">{children}</p>
  ),
  a: Anchor,
  ul: ({ children }: { children: ReactNode }) => (
    <ul className="flex list-disc flex-col gap-2 pl-5.5">{children}</ul>
  ),
  ol: ({ children }: { children: ReactNode }) => (
    <ol className="flex list-decimal flex-col gap-2 pl-5.5">{children}</ol>
  ),
  li: ({ children }: { children: ReactNode }) => (
    <li className="text-pretty">{children}</li>
  ),
  blockquote: ({ children }: { children: ReactNode }) => (
    <blockquote className="border-divider border-l-2 pl-4 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  table: ({ children }: { children: ReactNode }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  td: ({ children }: { children: ReactNode }) => (
    <td className="border-divider border-t px-3 py-2 text-pretty">
      {children}
    </td>
  ),
  th: ({ children }: { children: ReactNode }) => (
    <th className="border-divider border-t px-3 py-2 text-left text-ink">
      {children}
    </th>
  ),
  // Post images are paths on the blog; the CSP allows 'self' only, so
  // show what's there instead of a broken image.
  img: ({ alt, src }: { alt?: string; src?: string }) => (
    <span className="block rounded-md border border-dashed px-4 py-3 text-muted-foreground text-sm">
      Image: {alt || src}
    </span>
  ),
};

/**
 * The post body. A body that doesn't compile shows the compiler's message
 * and the source instead of failing the page: the blog's build would fail
 * on it too, which is exactly what the review should catch.
 */
export async function PostMdx({ source }: { source: string }) {
  let content: ReactElement;
  try {
    ({ content } = await compileMDX({
      source,
      components,
      options: { mdxOptions },
    }));
  } catch (error) {
    return (
      <div className="rounded-md border border-destructive/40 p-4 text-sm">
        <p className="font-medium text-destructive">
          This MDX doesn't compile, so the blog's build would fail on it.
        </p>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs">
          {error instanceof Error ? error.message : String(error)}
        </pre>
        <details className="mt-3">
          <summary className="cursor-pointer">Source</summary>
          <pre className="mt-2 overflow-x-auto font-mono text-xs">{source}</pre>
        </details>
      </div>
    );
  }
  return (
    <div className="flex max-w-[68ch] flex-col gap-6.5 text-md text-ink leading-relaxed">
      {content}
    </div>
  );
}
