import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import { closeDb, db } from "./index.ts";

// Runs before `next build` on Vercel and by hand locally (`pnpm db:migrate`).
const migrationsFolder = new URL("./migrations", import.meta.url).pathname;

if (process.env.DATABASE_URL) {
  await migratePostgres(db, { migrationsFolder });
} else {
  // biome-ignore lint/suspicious/noExplicitAny: same client, other driver type (see db/index.ts)
  await migratePglite(db as any, { migrationsFolder });
}
await closeDb();
console.log("Migrations applied.");
