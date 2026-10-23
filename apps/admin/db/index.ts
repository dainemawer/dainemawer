import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Neon in production and previews (DATABASE_URL), an embedded PGlite
// database under .data/ everywhere else — so `pnpm dev` and the tests need
// no Postgres server. Both are the same Postgres dialect through Drizzle;
// the PGlite instance is typed as the postgres-js one because the query
// and transaction APIs the app uses are identical.

function connect() {
  const url = process.env.DATABASE_URL;
  if (url) {
    return drizzlePostgres(postgres(url, { max: 5, prepare: false }), {
      schema,
      casing: "snake_case",
    });
  }
  const dataDir = process.env.PGLITE_DIR ?? ".data/pglite";
  mkdirSync(dataDir, { recursive: true });
  return drizzlePglite(new PGlite(dataDir), {
    schema,
    casing: "snake_case",
  }) as unknown as ReturnType<typeof drizzlePostgres<typeof schema>>;
}

// One connection per server process, surviving dev-mode module reloads.
const globalForDb = globalThis as unknown as {
  db?: ReturnType<typeof connect>;
};
export const db = globalForDb.db ?? connect();
globalForDb.db = db;

export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** For scripts: release the connection so the process can exit. */
export async function closeDb() {
  const client = db.$client as unknown as {
    end?: () => Promise<void>;
    close?: () => Promise<void>;
  };
  await (client.end ?? client.close)?.call(client);
}
