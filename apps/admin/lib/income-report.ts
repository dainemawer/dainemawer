import "server-only";
import { and, eq, gte, lte, min } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { customers, documents } from "@/db/schema";
import { TAG } from "@/lib/cache-tags";
import { addDays } from "@/lib/documents";
import {
  type IncomeLine,
  type Payment,
  randRatesFromEur,
  randTotal,
  taxYear,
  taxYearOf,
  toRand,
} from "@/lib/income";
import { CURRENCIES } from "@/lib/money";
import { requireSession } from "@/lib/session";
import { getToday } from "@/lib/today";

// Paid invoices in rand (lib/income.ts does the sums). Same shape as
// lib/dashboard.ts: each export checks the session, then calls cached reads.

const ENDPOINT = "https://api.frankfurter.dev/v1";

/** One tax year's paid invoices in rand, oldest first. */
export async function getIncomeYear(start: number) {
  await requireSession();
  const year = taxYear(start);
  const lines = await incomeBetween(year.from, year.to, await getToday());
  return { year, lines, total: randTotal(lines) };
}

/** Rand income this month, this tax year and last, for the dashboard. */
export async function getIncomeSummary() {
  await requireSession();
  const today = await getToday();
  const current = taxYear(taxYearOf(today));
  const previous = taxYear(current.start - 1);
  const lines = await incomeBetween(previous.from, today, today);
  const within = (from: string, to: string) =>
    randTotal(lines.filter((l) => l.paidAt >= from && l.paidAt <= to));
  return {
    month: within(`${today.slice(0, 7)}-01`, today),
    year: within(current.from, today),
    lastYear: within(previous.from, previous.to),
    current,
    previous,
    /** Payments with no rate (the ECB has none for that currency or day). */
    missing: lines.filter((l) => l.randMinor === null).length,
  };
}

/** Tax years from the first paid invoice's to today's, newest first. */
export async function incomeYears(): Promise<number[]> {
  await requireSession();
  const today = await getToday();
  const first = await firstPaidAt();
  const latest = taxYearOf(today);
  const earliest = first ? Math.min(taxYearOf(first), latest) : latest;
  return Array.from({ length: latest - earliest + 1 }, (_, i) => latest - i);
}

async function incomeBetween(
  from: string,
  to: string,
  today: string,
): Promise<IncomeLine[]> {
  const until = to < today ? to : today;
  const payments = await paidBetween(from, until);
  // Only fetch rates when something needs converting.
  const foreign = payments.some((p) => p.currency !== "ZAR");
  // A week early, so a payment on the first day still has the last
  // working day's rate before it.
  // Only the fetch is caught: the session check's own signals (a redirect,
  // or the prerender stopping at it) must reach Next. Without rates the
  // foreign payments come back without a rand amount, and the page says so.
  const rates = foreign
    ? await fetchRandRates(addDays(from, -7), until).catch((error) => {
        console.error("[income]", error);
        return {};
      })
    : {};
  return toRand(payments, rates);
}

async function paidBetween(from: string, to: string): Promise<Payment[]> {
  "use cache: remote";
  cacheTag(TAG.documents, TAG.customers);
  cacheLife("hours");
  const rows = await db
    .select({
      id: documents.id,
      number: documents.number,
      company: customers.company,
      currency: documents.currency,
      totalMinor: documents.totalMinor,
      paidAt: documents.paidAt,
    })
    .from(documents)
    .innerJoin(customers, eq(customers.id, documents.customerId))
    .where(
      and(
        eq(documents.kind, "invoice"),
        eq(documents.status, "paid"),
        gte(documents.paidAt, from),
        lte(documents.paidAt, to),
      ),
    )
    .orderBy(documents.paidAt, documents.number);
  return rows.flatMap((r) => (r.paidAt ? [{ ...r, paidAt: r.paidAt }] : []));
}

async function firstPaidAt(): Promise<string | null> {
  "use cache: remote";
  cacheTag(TAG.documents);
  cacheLife("hours");
  const [row] = await db
    .select({ first: min(documents.paidAt) })
    .from(documents)
    .where(and(eq(documents.kind, "invoice"), eq(documents.status, "paid")));
  return row?.first ?? null;
}

/**
 * ECB reference rates between two dates, as rand per unit. Past rates
 * never change; `to` is part of the key, so today's arrives with the date.
 */
async function fetchRandRates(from: string, to: string) {
  "use cache: remote";
  cacheLife({ stale: 3600, revalidate: 3 * 3600, expire: 7 * 86400 });
  const symbols = CURRENCIES.filter((c) => c !== "EUR").join(",");
  const response = await fetch(
    `${ENDPOINT}/${from}..${to}?base=EUR&symbols=${symbols}`,
    { cache: "no-store", signal: AbortSignal.timeout(8000) },
  );
  if (!response.ok) throw new Error(`Frankfurter HTTP ${response.status}`);
  return randRatesFromEur(await response.json());
}
