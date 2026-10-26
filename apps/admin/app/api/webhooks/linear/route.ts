import { revalidateTag } from "next/cache";
import { TAG } from "@/lib/cache-tags";
import { validSignature } from "@/lib/linear-signature";

// Linear calls this when a project or milestone changes (Linear → Settings
// → API → Webhooks, data types Projects and Project milestones, URL
// https://admin.dainemawer.com/api/webhooks/linear). It only expires the
// cached projects; the next visit to /projects fetches them fresh. Signed
// with LINEAR_WEBHOOK_SECRET; anything unsigned, stale or forged gets 401.

const MAX_AGE_MS = 60_000;

export async function POST(request: Request) {
  const secret = process.env.LINEAR_WEBHOOK_SECRET;
  const raw = await request.text();
  if (!secret || !validSignature(raw, request.headers, secret)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const payload = JSON.parse(raw) as {
    type?: string;
    webhookTimestamp?: number;
  };
  // Replays of an old, validly signed delivery are refused.
  if (
    typeof payload.webhookTimestamp !== "number" ||
    Math.abs(Date.now() - payload.webhookTimestamp) > MAX_AGE_MS
  ) {
    return new Response("Stale", { status: 401 });
  }
  if (payload.type?.startsWith("Project")) {
    revalidateTag(TAG.projects, { expire: 0 });
  }
  return new Response(null, { status: 204 });
}
