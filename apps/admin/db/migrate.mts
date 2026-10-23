import { migrate } from "drizzle-orm/postgres-js/migrator";
import { closeDb, db } from "./index.ts";

// Runs before production builds on Vercel (vercel.json). Local development
// migrates itself on `pnpm dev`.
if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Locally, `pnpm dev` applies migrations itself.",
  );
  process.exit(1);
}
await migrate(db, {
  migrationsFolder: new URL("./migrations", import.meta.url).pathname,
});
await closeDb();
console.log("Migrations applied.");
