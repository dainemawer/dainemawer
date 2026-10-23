import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

/**
 * The real auth check. proxy.ts only looks for a session cookie to redirect
 * quickly; every page and Server Action calls this, because actions are
 * public POST endpoints that a cookie-shaped header alone shouldn't open.
 */
export const requireSession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
});
