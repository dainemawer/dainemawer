import "server-only";
import { cacheLife } from "next/cache";
import { addDays } from "@/lib/documents";
import { FX_CURRENCIES, type FxRates, fxFromSeries } from "@/lib/fx";
import { requireSession } from "@/lib/session";
import { getToday } from "@/lib/today";

// The ECB publishes once a working day (around 16:00 CET), so the rates
// are cached in the shared runtime cache for hours, keyed by Cape Town's
// date. Frankfurter is free and needs no key.

const ENDPOINT = "https://api.frankfurter.dev/v1";
/** A little over a month, so the sparkline has ~22 working days. */
const HISTORY_DAYS = 35;

export async function getFxRates(): Promise<FxRates> {
  await requireSession();
  return fetchFx(await getToday());
}

async function fetchFx(today: string): Promise<FxRates> {
  "use cache: remote";
  cacheLife({ stale: 3600, revalidate: 3 * 3600, expire: 86400 });
  const from = addDays(today, -HISTORY_DAYS);
  const response = await fetch(
    `${ENDPOINT}/${from}..?base=ZAR&symbols=${FX_CURRENCIES.join(",")}`,
    { cache: "no-store", signal: AbortSignal.timeout(8000) },
  );
  if (!response.ok) throw new Error(`Frankfurter HTTP ${response.status}`);
  return fxFromSeries(await response.json());
}
