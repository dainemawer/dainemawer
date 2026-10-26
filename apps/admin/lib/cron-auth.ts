import "server-only";
import { timingSafeEqual } from "node:crypto";
import { audit } from "@/lib/audit";
import { ADMIN_EMAIL } from "@/lib/auth";
import { cronFailedEmail } from "@/lib/emails/security";
import { sendMail } from "@/lib/mail";

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

/**
 * A cron run failed: log it in the audit trail and email the admin, since
 * nothing else would say so. Never throws, so the route still answers 500.
 */
export async function reportCronFailure(job: string, message: string) {
  await audit("cron-failed", `${job}: ${message}`);
  await sendMail({
    to: [ADMIN_EMAIL],
    ...cronFailedEmail({
      origin: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
      job,
      message,
    }),
  }).catch((error) => console.error("cron failure email failed", error));
}
