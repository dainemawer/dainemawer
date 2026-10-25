import "server-only";
import { cacheLife } from "next/cache";
import { todayISO } from "@/lib/documents";

/**
 * Today in Cape Town, for rendering. Cached for a few minutes so pages that
 * derive statuses from it (overdue, expired) can still be prerendered into
 * a signed-in App Shell and prefetched; the cost is that "today" can lag
 * midnight by up to that long. Server Actions and the cron use
 * todayISO() directly, so writes always see the real date.
 */
export async function getToday() {
  "use cache";
  cacheLife("minutes");
  return todayISO();
}
