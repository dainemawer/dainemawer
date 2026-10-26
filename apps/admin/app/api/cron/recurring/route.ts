import { revalidateTag } from "next/cache";
import { TAG } from "@/lib/cache-tags";
import { isCronRequest, reportCronFailure } from "@/lib/cron-auth";
import { issueDueInvoices } from "@/lib/recurring";

// Vercel Cron calls this daily (vercel.json). Locally: set CRON_SECRET and
// curl it yourself with the bearer token.
export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { issued, failed } = await issueDueInvoices();
  if (issued.length) {
    // Not updateTag (Server Actions only); expire: 0 so the next visit
    // shows the new drafts instead of a stale list.
    revalidateTag(TAG.documents, { expire: 0 });
    revalidateTag(TAG.recurring, { expire: 0 });
  }
  if (failed.length) {
    await reportCronFailure(
      "Recurring invoices",
      `${failed.length} schedule${failed.length === 1 ? "" : "s"} couldn't issue: ${failed.join(", ")}.`,
    );
  }
  return Response.json(
    { issued: issued.map(({ id, number }) => ({ id, number })), failed },
    // A failure shows up as a failed run in Vercel's cron log.
    { status: failed.length ? 500 : 200 },
  );
}
