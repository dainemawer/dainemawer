import path from "node:path";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Same shape as the blog's CSP (see apps/blog/next.config.ts for why
// 'unsafe-inline' stays on script-src: Next's RSC payload ships as inline
// scripts). No third-party origins at all: the admin loads nothing
// external, and frames only its own PDF route.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self';
  connect-src 'self';
  frame-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'self';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  transpilePackages: ["@dm/ui"],
  // Loaded at runtime from node_modules rather than bundled: react-pdf
  // ships fonts and a layout engine.
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  async headers() {
    return [
      {
        // Every HTML page. The PDF routes are left out: a policy on the PDF
        // response itself applies to Chrome's viewer plugin, and
        // `object-src 'none'` there can stop the preview rendering.
        source: "/((?!documents/|sends/).*)",
        headers: [{ key: "Content-Security-Policy", value: cspHeader }],
      },
      {
        source: "/(.*)",
        headers: [
          // A private back office: never indexed, only framed by itself
          // (the PDF preview iframe).
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
