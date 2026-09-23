import Link from "next/link";
import type { ReactNode } from "react";

// Combined so both forms are recognised in document order in one pass —
// matching them with two separate regexes would require re-splicing the
// text and lose the relative ordering between a link and a code span.
const INLINE_PATTERN = /\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`/g;

/**
 * Renders the small subset of Markdown article content is allowed to use
 * inside otherwise-plain-text fields (shortAnswer, takeaways, faq) — not a
 * full Markdown parser, just `[label](url)` links and `` `code` `` spans.
 * The article body itself is real MDX; this is only for the frontmatter
 * fields that render as plain strings.
 */
export function renderInlineText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  INLINE_PATTERN.lastIndex = 0;
  for (
    let match = INLINE_PATTERN.exec(text);
    match !== null;
    match = INLINE_PATTERN.exec(text)
  ) {
    const [full, label, href, code] = match;
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (code !== undefined) {
      nodes.push(
        <code
          key={key++}
          className="rounded bg-ink/5 px-1 py-0.5 font-mono text-ink text-sm"
        >
          {code}
        </code>,
      );
    } else if (href.startsWith("/")) {
      nodes.push(
        <Link
          key={key++}
          href={href}
          className="text-ink underline decoration-divider underline-offset-2 hover:decoration-ink focus-visible:decoration-ink"
        >
          {label}
        </Link>,
      );
    } else {
      nodes.push(
        <a
          key={key++}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-ink underline decoration-divider underline-offset-2 hover:decoration-ink focus-visible:decoration-ink"
        >
          {label}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>,
      );
    }
    lastIndex = match.index + full.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

/**
 * Strips the same inline subset down to plain text — for contexts like
 * JSON-LD where markup isn't meaningful, only the words are.
 */
export function toPlainText(text: string): string {
  return text.replace(
    INLINE_PATTERN,
    (_full, label, _href, code) => code ?? label,
  );
}
