import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

// Next.js dev's hot reload re-evaluates this module on every edit, which
// would otherwise open a fresh connection pool each time; stashing the
// client on `globalThis` survives the reload so there's only ever one.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

// The Neon adapter talks over HTTP/WebSocket rather than a raw TCP socket,
// which is what makes this safe to call from a serverless function on
// Vercel — the pooled DATABASE_URL, since this is the runtime path, not
// migrations (see prisma.config.ts for those).
const adapter = new PrismaNeon({ connectionString: databaseUrl });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "@prisma/client";
export * from "./estimate";
