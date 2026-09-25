import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The pnpm lockfile lives at the monorepo root, one level up from this
  // app — without this, Next infers the wrong root from the topmost
  // lockfile it finds.
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
