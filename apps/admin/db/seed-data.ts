import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

/**
 * Idempotent: creates the single admin user (Better Auth's magic link has
 * sign-up disabled, so the user must exist first) and the settings row.
 * Used by `pnpm db:seed` (Neon) and by `pnpm dev` (local PGlite).
 */
export async function seedDatabase(
  db: PgDatabase<PgQueryResultHKT, typeof schema>,
  log: (message: string) => void = console.log,
) {
  const email = (process.env.ADMIN_EMAIL ?? "hello@dainemawer.com")
    .trim()
    .toLowerCase();

  const [existing] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, email));
  if (!existing) {
    await db.insert(schema.user).values({
      id: crypto.randomUUID(),
      name: "Daine Mawer",
      email,
      emailVerified: true,
    });
    log(`Created admin user ${email}.`);
  }

  await db
    .insert(schema.settings)
    .values({
      id: 1,
      email: "billing@dainemawer.com",
      website: "dainemawer.com",
    })
    .onConflictDoNothing();
}
