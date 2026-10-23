import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  transpilePackages: ["@dm/ui"],
  // Loaded at runtime from node_modules rather than bundled: PGlite ships
  // WASM and data files, react-pdf ships fonts and a layout engine.
  serverExternalPackages: ["@electric-sql/pglite", "@react-pdf/renderer"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  async headers() {
    return [
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
