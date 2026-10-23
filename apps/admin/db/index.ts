import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { LOCAL_DATABASE_URL } from "./local-url";
import * as schema from "./schema";

// Neon in production and previews (DATABASE_URL). Locally, `pnpm dev`
// starts an embedded PGlite database and serves it on LOCAL_DATABASE_URL
// (see db/local.mts), so the app always speaks plain Postgres and only
// one process ever owns the PGlite files.

function connect() {
  const url = process.env.DATABASE_URL ?? LOCAL_DATABASE_URL;
  return drizzle(postgres(url, { max: 5, prepare: false }), {
    schema,
    casing: "snake_case",
  });
}

// One pool per server process, surviving dev-mode module reloads.
const globalForDb = globalThis as unknown as {
  db?: ReturnType<typeof connect>;
};
export const db = globalForDb.db ?? connect();
globalForDb.db = db;

export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** For scripts: release the pool so the process can exit. */
export async function closeDb() {
  await db.$client.end();
}
