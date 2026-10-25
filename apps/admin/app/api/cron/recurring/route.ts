import { timingSafeEqual } from "node:crypto";
import { issueDueInvoices } from "@/lib/recurring";

// Vercel Cron calls this daily (vercel.json) with CRON_SECRET as a bearer
// token. Without the secret configured it refuses every request, so the
// route is never open. Locally: set CRON_SECRET and curl it yourself.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(given, `Bearer ${secret}`)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { issued, failed } = await issueDueInvoices();
  return Response.json(
    { issued: issued.map(({ id, number }) => ({ id, number })), failed },
    // A failure shows up as a failed run in Vercel's cron log.
    { status: failed.length ? 500 : 200 },
  );
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
