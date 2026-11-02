import "server-only";
import { connection } from "next/server";
import {
  type AttentionItem,
  documentItems,
  expenseReviewItems,
  healthItems,
  postItems,
  sortAttention,
} from "@/lib/attention-items";
import { countReviewQueue } from "@/lib/expenses/queries";
import { githubConfigured, listPostPulls } from "@/lib/github";
import { getHealth } from "@/lib/health-data";
import { listDocuments } from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { getToday } from "@/lib/today";

// The dashboard's "Needs you" list: what's waiting on you across the app,
// gathered from each area's normal readers (so every one checks the
// session). The rules live in lib/attention-items.ts.
//
// Each source fails on its own: GitHub being down drops the post line and
// says so, it doesn't hide an overdue invoice.

type Source = { name: string; read: () => Promise<AttentionItem[]> };

const SOURCES: Source[] = [
  {
    name: "Invoices and quotes",
    read: async () => {
      const [invoices, quotes, today] = await Promise.all([
        listDocuments("invoice"),
        listDocuments("quote"),
        getToday(),
      ]);
      return documentItems(
        [...invoices, ...quotes].map(({ document: d, company, status }) => ({
          id: d.id,
          kind: d.kind,
          number: d.number,
          company,
          status,
          currency: d.currency,
          totalMinor: d.totalMinor,
          paidMinor: d.paidMinor,
          dueDate: d.dueDate,
          validUntil: d.validUntil,
          recurringId: d.recurringId,
        })),
        today,
      );
    },
  },
  {
    name: "Blog posts",
    // Unset token: the area isn't in use, which isn't a failure.
    read: async () =>
      githubConfigured() ? postItems(await listPostPulls()) : [],
  },
  {
    name: "Expenses",
    read: async () => expenseReviewItems(await countReviewQueue()),
  },
  {
    name: "Health",
    read: async () => {
      const health = await getHealth();
      return healthItems({
        started: health.startKg !== null,
        weighedToday: health.today.weightGrams !== null,
      });
    },
  },
];

export async function getAttention(): Promise<{
  items: AttentionItem[];
  /** Sources that couldn't be read this time. */
  failed: string[];
}> {
  // Outside the per-source catch: a missing session must redirect.
  await requireSession();
  // GitHub is read live, so the list is never prerendered; this also stops
  // a prerender before the catch below could mistake that for a failure.
  await connection();
  const results = await Promise.allSettled(SOURCES.map((s) => s.read()));
  const failed: string[] = [];
  const items = results.flatMap((result, i) => {
    if (result.status === "fulfilled") return result.value;
    console.error(`[attention] ${SOURCES[i].name} failed`, result.reason);
    failed.push(SOURCES[i].name);
    return [];
  });
  return { items: sortAttention(items), failed };
}
