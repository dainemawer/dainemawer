import Link from "next/link";
import type { AnchorHTMLAttributes, ReactElement, ReactNode } from "react";
import { CodeBlock } from "@/components/code-block";
import { highlightCode } from "@/lib/highlight";

type CodeElement = ReactElement<{ className?: string; children: string }>;

// A custom `pre` override rather than `code`: MDX/remark wraps every fenced
// code block's <code> in a <pre>, so this is the one place that sees the
// whole block (language class + raw text) and can hand off to the site's
// existing shiki highlighter — reused as-is, unlike the old template which
// only ever rendered one hardcoded code block per post. Takes the post's
// slug via closure (from getMdxComponents below) so CodeBlock can tag its
// copy-tracking event with which post it happened on.
function createPre(postSlug: string) {
  return async function Pre({ children }: { children: CodeElement }) {
    const lang = children.props.className?.replace("language-", "") ?? "text";
    // An empty fenced block (```\n```) compiles to `children.props.children`
    // being undefined rather than "" — shiki throws on that, not just
    // renders blank, so it needs its own guard rather than falling through.
    const code = children.props.children ?? "";
    const html = await highlightCode(code, lang);
    return <CodeBlock code={code} html={html} postSlug={postSlug} />;
  };
}

// Inline `<code>` (not a fenced block, which is handled by Pre above).
function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-ink/5 px-1 py-0.5 font-mono text-ink text-sm">
      {children}
    </code>
  );
}

function Heading2({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mt-8 scroll-mt-10 text-ink text-lg tracking-tight">
      {children}
    </h2>
  );
}

function Heading3({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h3 id={id} className="mt-6 scroll-mt-10 text-ink text-base tracking-tight">
      {children}
    </h3>
  );
}

function Paragraph({ children }: { children: ReactNode }) {
  return <p className="text-pretty">{children}</p>;
}

// Same link treatment the old plain-text renderer (lib/inline-markdown.tsx)
// used, kept identical so imported prose doesn't visually shift.
function Anchor({
  href = "",
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const className =
    "text-ink underline decoration-divider underline-offset-2 hover:decoration-ink focus-visible:decoration-ink";
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
      {...rest}
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function UnorderedList({ children }: { children: ReactNode }) {
  return <ul className="flex list-disc flex-col gap-2 pl-5.5">{children}</ul>;
}

function OrderedList({ children }: { children: ReactNode }) {
  return (
    <ol className="flex list-decimal flex-col gap-2 pl-5.5">{children}</ol>
  );
}

function ListItem({ children }: { children: ReactNode }) {
  return <li className="text-pretty">{children}</li>;
}

function Blockquote({ children }: { children: ReactNode }) {
  return (
    <blockquote className="border-divider border-l-2 pl-4 text-muted italic">
      {children}
    </blockquote>
  );
}

function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

function TableCell({ children }: { children: ReactNode }) {
  return (
    <td className="border-divider border-t px-3 py-2 text-pretty">
      {children}
    </td>
  );
}

function TableHeaderCell({ children }: { children: ReactNode }) {
  return (
    <th className="border-divider border-t px-3 py-2 text-left text-ink">
      {children}
    </th>
  );
}

export function getMdxComponents(postSlug: string) {
  return {
    pre: createPre(postSlug),
    code: InlineCode,
    h2: Heading2,
    h3: Heading3,
    p: Paragraph,
    a: Anchor,
    ul: UnorderedList,
    ol: OrderedList,
    li: ListItem,
    blockquote: Blockquote,
    table: Table,
    td: TableCell,
    th: TableHeaderCell,
  };
}
