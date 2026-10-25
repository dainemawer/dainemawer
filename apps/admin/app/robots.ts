import type { MetadataRoute } from "next";

// Crawling stays allowed on purpose: the site is kept out of search by the
// `noindex` X-Robots-Tag header (next.config.ts) and robots meta tag
// (app/layout.tsx), and a crawler only obeys those on pages it may fetch.
// `Disallow: /` would hide them, and Google can still list a disallowed URL
// it finds linked elsewhere. Everything past /login needs a session anyway.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" } };
}
