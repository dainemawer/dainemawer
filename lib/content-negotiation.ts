// Markdown content negotiation, per https://acceptmarkdown.com and
// RFC 9110 §12.5.1: one URL, two representations, picked from `Accept`.
// The parsing lives here rather than inline in proxy.ts so it can be
// unit-tested without a Next request — proxy.ts is deliberately a thin
// wrapper over these functions.

/**
 * Media types a page URL can be served as, in server-preference order.
 * `text/html` first: a client that expresses no preference gets HTML.
 */
export const PRODUCES = ["text/html", "text/markdown"] as const;

export type Produced = (typeof PRODUCES)[number];

type AcceptEntry = {
  type: string;
  q: number;
  /** 2 = `type/subtype`, 1 = `type/*`, 0 = `*_/_*`. Higher wins ties. */
  specificity: number;
};

function parseAccept(header: string): AcceptEntry[] {
  return header.split(",").map((raw) => {
    const parts = raw
      .trim()
      .split(";")
      .map((part) => part.trim());
    const type = (parts[0] ?? "").toLowerCase();

    let q = 1;
    for (const param of parts.slice(1)) {
      const [name, value] = param.split("=").map((part) => part.trim());
      if (name?.toLowerCase() !== "q") continue;
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) q = Math.max(0, Math.min(1, parsed));
    }

    const specificity = type === "*/*" ? 0 : type.endsWith("/*") ? 1 : 2;
    return { type, q, specificity };
  });
}

function matches(entry: AcceptEntry, candidate: string): boolean {
  if (entry.type === "*/*") return true;
  if (entry.type.endsWith("/*")) {
    return candidate.startsWith(entry.type.slice(0, -1));
  }
  return entry.type === candidate;
}

/**
 * The representation to serve, or `null` when the client accepts none of
 * them (→ 406). A missing `Accept` header means "no constraint", which is
 * not the same as an empty one: `Accept: ` rejects everything.
 */
export function preferredType(
  header: string | null | undefined,
): Produced | null {
  if (header === null || header === undefined) return PRODUCES[0];

  const entries = parseAccept(header);
  if (entries.length === 0) return PRODUCES[0];

  let best: Produced | null = null;
  let bestQ = -1;
  let bestPosition = Number.POSITIVE_INFINITY;

  for (const candidate of PRODUCES) {
    // RFC 9110 §12.5.1: the most specific matching range wins regardless
    // of q, so `text/html;q=0, */*` still rejects HTML rather than letting
    // the wildcard's higher q override the explicit refusal.
    let matched: AcceptEntry | null = null;
    let matchedPosition = Number.POSITIVE_INFINITY;

    for (const [index, entry] of entries.entries()) {
      if (!matches(entry, candidate)) continue;
      if (
        matched === null ||
        entry.specificity > matched.specificity ||
        (entry.specificity === matched.specificity && index < matchedPosition)
      ) {
        matched = entry;
        matchedPosition = index;
      }
    }

    if (matched === null || matched.q <= 0) continue;

    // Across candidates: highest q wins, ties broken on the order the
    // client listed them, so `Accept: text/markdown, text/html` is
    // markdown even though PRODUCES lists HTML first.
    if (
      matched.q > bestQ ||
      (matched.q === bestQ && matchedPosition < bestPosition)
    ) {
      bestQ = matched.q;
      bestPosition = matchedPosition;
      best = candidate;
    }
  }

  return best;
}

/**
 * Add `Accept` to an existing `Vary` without dropping what's already
 * there — Next sets its own `Vary` (rsc, next-router-state-tree, …) on
 * every App Router response, and clobbering it breaks client navigation
 * caching.
 */
export function appendVaryAccept(headers: Headers): void {
  const existing = headers.get("Vary");
  if (!existing) {
    headers.set("Vary", "Accept");
    return;
  }
  const tokens = existing.split(",").map((token) => token.trim().toLowerCase());
  if (tokens.includes("accept") || tokens.includes("*")) return;
  headers.set("Vary", `${existing}, Accept`);
}

/**
 * Internal route serving the markdown twin of a page path.
 * `/` → `/md`, `/about` → `/md/about`, `/topics/css` → `/md/topics/css`.
 */
export function markdownPathFor(pathname: string): string {
  const normalised = pathname.replace(/\/+$/, "");
  return normalised === "" ? "/md" : `/md${normalised}`;
}

/**
 * Page paths that deliberately serve something other than HTML: Next's
 * generated image routes, which carry no file extension in their URL.
 * Negotiation must skip them, or an image crawler sending
 * `Accept: image/png` would be answered with 406.
 */
const NON_HTML_ROUTES =
  /(?:^|\/)(?:opengraph-image|twitter-image|icon|apple-icon)$/;

export function servesNonHtml(pathname: string): boolean {
  return NON_HTML_ROUTES.test(pathname);
}

/**
 * Request header proxy.ts sets when it rewrote a canonical URL to its
 * markdown twin because of `Accept`, as opposed to the request arriving
 * at an explicit `.md` URL. Only the negotiated variant has to stay out
 * of shared caches — see the note in proxy.ts.
 */
export const NEGOTIATED_HEADER = "x-markdown-negotiated";
