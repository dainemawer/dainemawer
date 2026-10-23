import { eq } from "drizzle-orm";
import { closeDb, db } from "./index.ts";
import { settings, user } from "./schema.ts";

// Idempotent: creates the single admin user (Better Auth's magic link has
// sign-up disabled, so the user must exist first) and the settings row.
const email = (process.env.ADMIN_EMAIL ?? "hello@dainemawer.com")
  .trim()
  .toLowerCase();

const [existing] = await db.select().from(user).where(eq(user.email, email));
if (!existing) {
  await db.insert(user).values({
    id: crypto.randomUUID(),
    name: "Daine Mawer",
    email,
    emailVerified: true,
  });
  console.log(`Created admin user ${email}.`);
} else {
  console.log(`Admin user ${email} already exists.`);
}

await db
  .insert(settings)
  .values({ id: 1, email: "billing@dainemawer.com", website: "dainemawer.com" })
  .onConflictDoNothing();
console.log("Settings row ready.");

await closeDb();
