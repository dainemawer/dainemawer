import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Set once a GTM container exists (see components/analytics.tsx) — until
// then this stays empty and the CSP below stays as strict as it's ever been.
const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

// 'unsafe-inline' on script-src, in production too: React/Next's own RSC
// hydration payload ships as inline `self.__next_f.push(...)` scripts on
// every page with a Client Component — that's not optional, and without
// 'unsafe-inline' (or a nonce) the browser blocks every one of them, so
// the page never hydrates at all (confirmed directly: a production build
// with zero analytics code still throws React error #412 under a strict
// script-src). The documented fix is nonce-based CSP via Proxy, but that
// requires dynamic rendering on every single page (no static generation,
// no ISR) — not a trade this mostly-static blog is making. Subresource
// Integrity was also checked: Next's own docs rule it out for this case
// ("cannot handle dynamically generated scripts"), which the RSC payload
// is. 'unsafe-inline' still leaves script-src doing real work: it blocks
// loading a script from any origin outside 'self' and the two allowed
// analytics domains — it just stops enforcing against inline content,
// which matters less on a site with no user-generated content rendered
// back to visitors. No nonce: that would force every page dynamic, so
// GTM's dataLayer bootstrap stays a same-origin static file
// (public/gtm-init.js) rather than adding to the inline-script surface —
// only gtm.js and GA4's collection endpoints need domain allowlisting,
// and only once NEXT_PUBLIC_GTM_ID is actually set.
// Vercel Analytics is proxied same-origin (/_vercel/insights/*) in
// production on Vercel, so 'self' covers it there — but locally (and on
// any non-Vercel host) the package falls back to its public domains, so
// those stay allowlisted unconditionally rather than gated behind an env
// var like GTM above.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${gtmId ? " https://www.googletagmanager.com" : ""} https://va.vercel-scripts.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  connect-src 'self'${gtmId ? " https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com" : ""} https://vitals.vercel-insights.com;
  ${gtmId ? "frame-src https://www.googletagmanager.com;" : ""}
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        // App Router dynamic segments can't include a literal suffix
        // (`app/[slug].md` isn't a supported file convention), so the
        // markdown twin lives at /md/[slug] and is rewritten here to
        // keep the public URL at /:slug.md.
        source: "/:slug.md",
        destination: "/md/:slug",
      },
    ];
  },
  async redirects() {
    return [
      // Old site used /articles/<slug>; this one is flat. One entry per
      // migrated post, old slug -> new (often shortened) slug.
      {
        source:
          "/articles/leading-with-ai-what-helped-me-through-the-hard-parts",
        destination: "/leading-with-ai",
        permanent: true,
      },
      {
        source:
          "/articles/the-rise-of-no-code-and-low-code-in-frontend-development",
        destination: "/no-code-low-code-frontend",
        permanent: true,
      },
      {
        source:
          "/articles/using-css-custom-properties-with-fallbacks-for-efficiency",
        destination: "/css-custom-properties-fallbacks",
        permanent: true,
      },
      {
        source: "/articles/what-is-google-baseline-and-its-impact",
        destination: "/what-is-google-baseline",
        permanent: true,
      },
      {
        source:
          "/articles/determine-when-a-sticky-element-is-stuck-in-javascript",
        destination: "/determine-when-a-sticky-element-is-stuck",
        permanent: true,
      },
      {
        source:
          "/articles/unlocking-project-success-mastering-task-estimation-with-the-fate-framework",
        destination: "/mastering-task-estimation",
        permanent: true,
      },
      {
        source:
          "/articles/enhance-your-react-apps-scalability-using-storybook-and-chromatic",
        destination: "/react-scalability-storybook",
        permanent: true,
      },
      {
        source: "/articles/understanding-chromes-coverage-panel",
        destination: "/understanding-chromes-coverage-panel",
        permanent: true,
      },
      {
        source:
          "/articles/how-to-effectively-setup-nextjs-with-a-component-library-using-monorepos",
        destination: "/nextjs-component-library-monorepo",
        permanent: true,
      },
      {
        source: "/articles/ten-proven-techniques-for-effective-code-reviews",
        destination: "/effective-code-reviews",
        permanent: true,
      },
      {
        source: "/articles/four-tips-for-properly-using-the-return-statement",
        destination: "/using-the-return-statement",
        permanent: true,
      },
      {
        source: "/articles/leveraging-commitlint-for-consistency",
        destination: "/leveraging-commitlint",
        permanent: true,
      },
      {
        source:
          "/articles/five-frontend-file-architectures-for-better-code-organisation",
        destination: "/frontend-file-architectures",
        permanent: true,
      },
      {
        source: "/articles/how-to-motivate-and-inspire-individual-contributors",
        destination: "/motivate-individual-contributors",
        permanent: true,
      },
      // Dropped: personal/lifestyle content, doesn't fit the new site's
      // strictly-technical positioning (see lib/llms.ts) — send to home
      // rather than 404.
      {
        source: "/articles/four-surprising-benefits-of-intermittent-fasting",
        destination: "/",
        permanent: true,
      },
      {
        source: "/articles/waking-up-early-a-crash-course-for-engineers",
        destination: "/",
        permanent: true,
      },
      {
        source:
          "/articles/the-future-of-frontend-development-in-2025-trends-ai-and-the-evolving-role-of-engineers",
        destination: "/",
        permanent: true,
      },
      // Dropped: the old page 500s (noindex + broken render already), and
      // was never imported — nothing to redirect to.
      {
        source: "/articles/nextjs-seo-checklist-for-frontend-developers",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
