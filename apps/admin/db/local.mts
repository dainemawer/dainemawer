import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import EmbeddedPostgres from "embedded-postgres";
import postgres from "postgres";
import {
  LOCAL_DATABASE_NAME,
  LOCAL_DATABASE_PORT,
  LOCAL_DATABASE_URL,
} from "./local-url.ts";
import * as schema from "./schema.ts";
import { seedDatabase } from "./seed-data.ts";

// `pnpm dev`: starts a real Postgres 17 server (the embedded-postgres
// binaries, no Docker or install needed) with its data in .data/postgres,
// migrates and seeds it, then runs `next dev` against it. A real server
// matters: `next dev` runs the app in several processes, which an
// embedded-in-process database can't share safely.
//
// With DATABASE_URL set in the shell (a Neon branch, say), this just runs
// `next dev` against that. It's deliberately not read from .env.local,
// where `vercel env pull` writes the production URL.

const nextArgs = ["dev", "--port", "3001", ...process.argv.slice(2)];

if (process.env.DATABASE_URL) {
  const child = spawn("next", nextArgs, { stdio: "inherit" });
  child.on("exit", (code) => process.exit(code ?? 0));
} else {
  const databaseDir = path.resolve(".data/postgres");
  const pg = new EmbeddedPostgres({
    databaseDir,
    port: LOCAL_DATABASE_PORT,
    user: "postgres",
    password: "postgres",
    persistent: true,
    onLog: () => {},
  });
  if (!existsSync(path.join(databaseDir, "PG_VERSION"))) await pg.initialise();
  await pg.start();
  await pg.createDatabase(LOCAL_DATABASE_NAME).catch(() => {
    // Already exists.
  });

  const client = postgres(LOCAL_DATABASE_URL, { max: 1, onnotice: () => {} });
  const db = drizzle(client, { schema, casing: "snake_case" });
  await migrate(db, {
    migrationsFolder: new URL("./migrations", import.meta.url).pathname,
  });
  await seedDatabase(db);
  await client.end();
  console.log(`Local database ready at ${LOCAL_DATABASE_URL}`);

  const child = spawn("next", nextArgs, {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: LOCAL_DATABASE_URL },
  });

  // Ctrl+C reaches the whole process group: let Next exit first, then stop
  // Postgres cleanly so it doesn't need crash recovery next time.
  process.on("SIGINT", () => {});
  process.on("SIGTERM", () => child.kill("SIGTERM"));
  child.on("exit", async (code) => {
    await pg.stop();
    process.exit(code ?? 0);
  });
}
