import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { eq } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user } from "@/db/schema";
import { ADMIN_EMAIL, auth } from "@/lib/auth";

type Session = { user: { id: string; email: string } };

const owner = new AsyncLocalStorage<Session>();

/**
 * The real auth check. proxy.ts only looks for a session cookie to redirect
 * quickly; every data read (lib/queries.ts), page, Server Action and PDF
 * route calls this, because actions are public POST endpoints that a
 * cookie-shaped header alone shouldn't open.
 *
 * `use cache: private` gives the result a lifetime in the browser only (it
 * is never stored on the server), which is what lets signed-in pages be
 * prefetched. On the server it runs on every request, so Server Actions
 * always re-check the session.
 */
export async function requireSession() {
  return owner.getStore() ?? sessionFromCookie();
}

async function sessionFromCookie(): Promise<Session> {
  "use cache: private";
  // Five minutes is the minimum stale time for signed-in content to join a
  // route's prefetched App Shell.
  cacheLife({ stale: 300 });
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return { user: { id: session.user.id, email: session.user.email } };
}

/**
 * Runs `read` as the admin without a browser session, so it can use the
 * same data layer as the pages. Only for a caller that has already proved
 * it's you another way: the Telegram webhook (its secret and your chat ID).
 */
export async function asOwner<T>(read: () => Promise<T>): Promise<T> {
  const [admin] = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(eq(user.email, ADMIN_EMAIL));
  if (!admin) throw new Error("The admin user doesn't exist yet.");
  return owner.run({ user: admin }, read);
}
