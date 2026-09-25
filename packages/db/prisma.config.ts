import { defineConfig, env } from "prisma/config";

// Env vars are already loaded before this file runs — every script in
// package.json wraps the Prisma CLI with `dotenv -e ../../.env.local --`,
// since DATABASE_URL/DATABASE_URL_UNPOOLED live in the monorepo root's
// .env.local (pulled from Neon), not one local to this package.
//
// Migrations need the direct/unpooled connection: Neon's pooled one drops
// session state (prepared statements, SET search_path) between calls,
// which Prisma Migrate depends on. The runtime client (src/index.ts)
// uses the pooled DATABASE_URL instead, via the Neon driver adapter.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL_UNPOOLED"),
  },
});
