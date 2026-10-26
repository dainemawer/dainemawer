import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { signInEmail } from "@/lib/emails/sign-in";
import { sendMail } from "@/lib/mail";

/** The one address that can log in. The matching user row is created by `pnpm db:seed`. */
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "hello@dainemawer.com")
  .trim()
  .toLowerCase();

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  session: { expiresIn: 60 * 60 * 24 * 30 },
  rateLimit: {
    storage: "database",
    customRules: { "/sign-in/magic-link": { window: 15 * 60, max: 5 } },
  },
  plugins: [
    magicLink({
      disableSignUp: true,
      expiresIn: 15 * 60,
      storeToken: "hashed",
      // Every address gets the same "check your inbox" response; only the
      // admin's actually receives a link.
      async sendMagicLink({ email, url }) {
        if (email.trim().toLowerCase() !== ADMIN_EMAIL) return;
        await sendMail({ to: [email], ...signInEmail({ url, minutes: 15 }) });
      },
    }),
    // Must stay last: lets Server Actions set Better Auth's cookies.
    nextCookies(),
  ],
});
