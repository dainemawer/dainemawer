import "server-only";
import { passkey as passkeyPlugin } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { audit, requestOrigin } from "@/lib/audit";
import { signInAlertEmail } from "@/lib/emails/security";
import { emailSignInOffEmail, signInEmail } from "@/lib/emails/sign-in";
import { sendMail } from "@/lib/mail";

/** The one address that can log in. The matching user row is created by `pnpm db:seed`. */
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "hello@dainemawer.com")
  .trim()
  .toLowerCase();

const APP_URL = new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3001");

/**
 * Once a passkey exists, email links stop working, so someone with access
 * to the inbox alone can't get in. ALLOW_EMAIL_SIGN_IN=1 in the environment
 * turns them back on: the recovery path if every passkey is lost.
 */
export async function emailSignInAllowed() {
  if (process.env.ALLOW_EMAIL_SIGN_IN === "1") return true;
  const [row] = await db
    .select({ id: schema.passkey.id })
    .from(schema.passkey)
    .limit(1);
  return !row;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  // A week, sliding: each day you use the app pushes it out again, so an
  // idle session (a lost laptop, a shared browser) ends within 7 days.
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  rateLimit: {
    storage: "database",
    customRules: {
      "/sign-in/magic-link": { window: 15 * 60, max: 5 },
      "/passkey/verify-authentication": { window: 15 * 60, max: 10 },
    },
  },
  hooks: {
    // Every new session is logged and emailed, so a sign-in you didn't make
    // doesn't go unnoticed. Passkey changes are logged too.
    after: createAuthMiddleware(async (ctx) => {
      const headers = ctx.request?.headers ?? ctx.headers ?? null;
      if (ctx.context.newSession) {
        const method = ctx.path.startsWith("/passkey")
          ? "Passkey"
          : "Email link";
        await audit("sign-in", method, headers);
        await sendMail({
          to: [ADMIN_EMAIL],
          ...signInAlertEmail({
            origin: APP_URL.origin,
            method,
            from: requestOrigin(headers),
            at: new Date(),
          }),
        }).catch((error) => console.error("sign-in alert failed", error));
      }
      const failed = ctx.context.returned instanceof APIError;
      if (ctx.path === "/passkey/verify-registration" && !failed) {
        await audit("passkey-added", null, headers);
      }
      if (ctx.path === "/passkey/delete-passkey" && !failed) {
        await audit("passkey-removed", null, headers);
      }
    }),
  },
  plugins: [
    magicLink({
      disableSignUp: true,
      expiresIn: 15 * 60,
      storeToken: "hashed",
      // Every address gets the same "check your inbox" response; only the
      // admin's actually receives anything.
      async sendMagicLink({ email, url }, ctx) {
        if (email.trim().toLowerCase() !== ADMIN_EMAIL) return;
        if (!(await emailSignInAllowed())) {
          await audit(
            "sign-in-blocked",
            "Email link while passkeys are on",
            ctx?.headers,
          );
          await sendMail({
            to: [email],
            ...emailSignInOffEmail({ origin: new URL(url).origin }),
          });
          return;
        }
        await sendMail({ to: [email], ...signInEmail({ url, minutes: 15 }) });
      },
    }),
    passkeyPlugin({
      rpID: APP_URL.hostname,
      rpName: "dainemawer admin",
      origin: APP_URL.origin,
    }),
    // Must stay last: lets Server Actions set Better Auth's cookies.
    nextCookies(),
  ],
});
