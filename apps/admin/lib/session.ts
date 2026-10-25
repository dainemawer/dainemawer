import "server-only";
import { cacheLife } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

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
  "use cache: private";
  // Five minutes is the minimum stale time for signed-in content to join a
  // route's prefetched App Shell.
  cacheLife({ stale: 300 });
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return { user: { id: session.user.id, email: session.user.email } };
}
