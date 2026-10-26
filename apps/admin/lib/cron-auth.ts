import "server-only";
import { timingSafeEqual } from "node:crypto";

/**
 * Vercel Cron sends CRON_SECRET as a bearer token. Without the secret
 * configured every request is refused, so the cron routes are never open.
 */
export function isCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return (
    Boolean(secret) &&
    given.length === expected.length &&
    timingSafeEqual(given, expected)
  );
}
