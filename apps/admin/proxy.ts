import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

// A fast, optimistic redirect for signed-out visitors. It only checks that
// a session cookie exists — lib/session.ts validates it on every page and
// Server Action. Cron routes check their own bearer secret, and webhooks
// their sender's signature, instead.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!login|api/auth|api/cron|api/webhooks|email/|_next/static|_next/image|favicon.ico|robots.txt).*)",
  ],
};
