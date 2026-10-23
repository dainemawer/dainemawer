import { closeDb, db } from "./index.ts";
import { seedDatabase } from "./seed-data.ts";

// Seeds the database at DATABASE_URL (e.g. Neon after the first deploy).
// Local development seeds itself on `pnpm dev`.
if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Locally, `pnpm dev` seeds the database itself.",
  );
  process.exit(1);
}
await seedDatabase(db);
await closeDb();
console.log("Seeded.");
