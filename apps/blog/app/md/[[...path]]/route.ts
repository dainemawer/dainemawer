import { NEGOTIATED_HEADER } from "@/lib/content-negotiation";
import { mdUrl, resolveMarkdownDocument } from "@/lib/markdown-pages";
import { site } from "@/lib/site";

// The markdown representation of every page. Three ways in, one handler:
// proxy.ts rewrites here when `Accept: text/markdown` wins negotiation,
// next.config.ts rewrites the public `/:slug.md` URLs here, and the
// /md/* paths themselves are reachable directly.

function canonicalFor(segments: string[]): string {
  if (
    segments.length === 0 ||
    (segments.length === 1 && segments[0] === "index")
  ) {
    return "/";
  }
  return `/${segments.join("/")}`;
}

export async function GET(
  request: Request,
  ctx: RouteContext<"/md/[[...path]]">,
) {
  const { path } = await ctx.params;
  const segments = path ?? [];
  const { body, status, pagination } = resolveMarkdownDocument(segments);

  // Served from the canonical URL via Accept negotiation rather than
  // from an explicit .md path. Next strips `Vary: Accept` from the HTML
  // side of the pair (see proxy.ts), so this variant has to be
  // unstorable — otherwise a shared cache could hand markdown to a
  // browser that asked for HTML. The .md URLs stay cacheable: they are
  // separate URLs and negotiate nothing.
  const negotiated = request.headers.get(NEGOTIATED_HEADER) === "1";

  const headers = new Headers({
    "Content-Type": "text/markdown; charset=utf-8",
    Vary: "Accept",
    "Cache-Control": negotiated
      ? "private, no-store"
      : status === 200
        ? "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400"
        : "public, max-age=0, s-maxage=300",
  });

  if (status === 200) {
    const links = [`<${site.url}${canonicalFor(segments)}>; rel="canonical"`];
    // Neighbouring pages point at their Markdown twins, so a client
    // walking a paginated index stays in the representation it asked for.
    if (pagination?.previous) {
      links.push(`<${mdUrl(pagination.previous)}>; rel="prev"`);
    }
    if (pagination?.next) {
      links.push(`<${mdUrl(pagination.next)}>; rel="next"`);
    }
    headers.set("Link", links.join(", "));
  }

  return new Response(body, { status, headers });
}
