import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  appendVaryAccept,
  markdownPathFor,
  NEGOTIATED_HEADER,
  preferredType,
  servesNonHtml,
} from "@/lib/content-negotiation";

// Markdown content negotiation for every HTML page: one canonical URL
// serves HTML to browsers and markdown to agents that ask for it.
// https://acceptmarkdown.com/recipes/nextjs
//
// Server Components render HTML unconditionally, so a page can't check
// Accept for itself — the rewrite has to happen before the route runs,
// which means here. The parsing lives in lib/content-negotiation.ts so
// it stays unit-testable; this file is only the plumbing.

// Next's own client sends this for Server Function results. It strips
// the RSC/Next-Router-* request headers (and the `_rsc` param) before
// proxy runs, so those can't be matched on — but a client navigation's
// fetch sends no Accept at all, which negotiates to HTML and falls
// through harmlessly. This covers the Accept-bearing case.
const RSC_CONTENT_TYPE = "text/x-component";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accept = request.headers.get("accept");

  if (
    // Server Function calls POST to the page path they live on.
    (request.method !== "GET" && request.method !== "HEAD") ||
    accept?.includes(RSC_CONTENT_TYPE) ||
    // Belt and braces: the matcher below excludes the generated image
    // routes too, but a matcher typo fails open and would 406 every
    // request for an Open Graph card.
    servesNonHtml(pathname)
  ) {
    return NextResponse.next();
  }

  const chosen = preferredType(accept);

  if (chosen === "text/markdown") {
    const url = request.nextUrl.clone();
    url.pathname = markdownPathFor(pathname);

    // Flags the markdown handler to mark the response uncacheable. See
    // the note on Vary below: the HTML half of this pair can't carry
    // `Vary: Accept`, so the markdown half must never enter a shared
    // cache under the canonical URL, or a browser could be handed it.
    const headers = new Headers(request.headers);
    headers.set(NEGOTIATED_HEADER, "1");

    const rewritten = NextResponse.rewrite(url, { request: { headers } });
    appendVaryAccept(rewritten.headers);
    return rewritten;
  }

  if (chosen === null) {
    // RFC 9110 §15.5.7: the client rejected both representations, so say
    // so rather than silently sending one it told us not to send.
    return new Response(
      `Not Acceptable\n\n${pathname} is available as text/html and text/markdown.\nYou sent: Accept: ${accept}\n`,
      {
        status: 406,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          Vary: "Accept",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  // Known limitation: this `Vary` does not survive on App Router page
  // responses. Next's own page handler calls `setHeader('Vary', …)` with
  // its RSC list after proxy headers are applied, replacing rather than
  // appending (next/dist/server/base-server.js `setVaryHeader`, then the
  // app-page runtime). The markdown branch above compensates by staying
  // out of shared caches entirely. Route handler responses — including
  // the markdown twins — set their own `Vary: Accept` and keep it.
  const response = NextResponse.next();
  appendVaryAccept(response.headers);
  return response;
}

export const config = {
  // Page routes only. Excluded: API routes, Next internals, the markdown
  // handler itself, anything with a file extension (feeds, robots.txt,
  // sitemap.xml, the /:slug.md twins, static assets) and the generated
  // image routes, which have no extension in their URL.
  matcher: [
    "/((?!api/|_next/|_vercel/|md/|.*\\.|(?:.*/)?(?:opengraph-image|twitter-image|icon|apple-icon)$).*)",
  ],
};
