import "server-only";
import { asc, count, desc, eq, gte, inArray } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { db } from "@/db";
import {
  type ExpenseCategory,
  type ExpenseLabel,
  expenseAccounts,
  expenseCategories,
  expenseLabels,
  expenseMonthly,
  expenseNotes,
  expenseRules,
} from "@/db/schema";
import { TAG } from "@/lib/cache-tags";
import { addDays } from "@/lib/documents";
import { aiConfigured } from "@/lib/expenses/ai";
import { getBalance, investecConfigured } from "@/lib/expenses/investec";
import {
  fetchIncluded,
  HISTORY_DAYS,
  includedAccountIds,
} from "@/lib/expenses/recon";
import {
  monthEnd,
  monthOf,
  postingDateFromId,
  type Transaction,
} from "@/lib/expenses/transactions";
import { requireSession } from "@/lib/session";
import { getToday } from "@/lib/today";

// Same shape as lib/queries.ts: every export checks the session first.
// What the app stores (categories, labels, totals, memory) goes through
// `use cache: remote` like the rest of the app. Investec data is fetched
// live on every request and never cached, so no bank data sits in Vercel's
// cache; those readers call connection() so nothing tries to fetch it
// while prerendering.

function cached() {
  cacheTag(TAG.expenses);
  cacheLife("hours");
}

export async function getExpensesState() {
  await requireSession();
  return {
    investec: investecConfigured(),
    ai: aiConfigured(),
    setUp: await cachedSetUp(),
  };
}

async function cachedSetUp() {
  "use cache: remote";
  cached();
  const [row] = await db.select({ n: count() }).from(expenseCategories);
  return row.n > 0;
}

export async function getOverview() {
  await requireSession();
  const today = await getToday();
  return { today, ...(await cachedOverview(addDays(today, -400))) };
}

async function cachedOverview(since: string) {
  "use cache: remote";
  cached();
  const [categories, totals, [review], [last]] = await Promise.all([
    db
      .select()
      .from(expenseCategories)
      .orderBy(asc(expenseCategories.position)),
    db
      .select()
      .from(expenseMonthly)
      .where(gte(expenseMonthly.month, monthOf(since))),
    db
      .select({ n: count() })
      .from(expenseLabels)
      .where(eq(expenseLabels.needsReview, true)),
    db
      .select({ at: expenseLabels.createdAt })
      .from(expenseLabels)
      .orderBy(desc(expenseLabels.createdAt))
      .limit(1),
  ]);
  return {
    categories,
    totals,
    review: review.n,
    lastSyncedAt: last?.at.toISOString() ?? null,
  };
}

export async function listCategories() {
  await requireSession();
  return cachedCategories();
}

async function cachedCategories() {
  "use cache: remote";
  cached();
  return db
    .select()
    .from(expenseCategories)
    .orderBy(asc(expenseCategories.position));
}

export async function getExpenseSettings() {
  await requireSession();
  return cachedSettings();
}

async function cachedSettings() {
  "use cache: remote";
  cached();
  const [accounts, categories, usage, rules, notes] = await Promise.all([
    db.select().from(expenseAccounts).orderBy(asc(expenseAccounts.name)),
    db
      .select()
      .from(expenseCategories)
      .orderBy(asc(expenseCategories.position)),
    db
      .select({ id: expenseLabels.categoryId, n: count() })
      .from(expenseLabels)
      .groupBy(expenseLabels.categoryId),
    db
      .select({ rule: expenseRules, category: expenseCategories.name })
      .from(expenseRules)
      .innerJoin(
        expenseCategories,
        eq(expenseCategories.id, expenseRules.categoryId),
      )
      .orderBy(asc(expenseRules.pattern)),
    db.select().from(expenseNotes).orderBy(asc(expenseNotes.createdAt)),
  ]);
  const used = new Map(usage.map((u) => [u.id, u.n]));
  return {
    accounts,
    categories: categories.map((c) => ({ ...c, used: used.get(c.id) ?? 0 })),
    rules,
    notes,
  };
}

export type LabelledTransaction = {
  transaction: Transaction;
  label: ExpenseLabel | null;
  category: ExpenseCategory | null;
};

async function withLabels(
  transactions: Transaction[],
): Promise<LabelledTransaction[]> {
  const [labels, categories] = await Promise.all([
    transactions.length
      ? db
          .select()
          .from(expenseLabels)
          .where(
            inArray(
              expenseLabels.transactionId,
              transactions.map((tx) => tx.id),
            ),
          )
      : [],
    cachedCategories(),
  ]);
  const labelById = new Map(labels.map((l) => [l.transactionId, l]));
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  return transactions.map((transaction) => {
    const label = labelById.get(transaction.id) ?? null;
    return {
      transaction,
      label,
      category: label ? (categoryById.get(label.categoryId) ?? null) : null,
    };
  });
}

/** One month's transactions (month = its first day), live from Investec. */
export async function listMonthTransactions(month: string) {
  await requireSession();
  await connection();
  const today = await getToday();
  // biome-ignore lint/complexity/useMathMinMax: ISO date strings, not numbers
  const end = monthEnd(month) < today ? monthEnd(month) : today;
  return withLabels(await fetchIncluded(month, end));
}

/** Transactions the classifier wasn't sure about, live from Investec. */
export async function getReviewQueue() {
  await requireSession();
  await connection();
  const today = await getToday();
  const pending = await db
    .select({ id: expenseLabels.transactionId })
    .from(expenseLabels)
    .where(eq(expenseLabels.needsReview, true));
  if (!pending.length) return { items: [], missing: 0 };
  // The IDs carry their posting date: fetch only as far back as needed.
  const earliest = pending
    .map((p) => postingDateFromId(p.id) ?? addDays(today, -HISTORY_DAYS))
    .sort()[0];
  const wanted = new Set(pending.map((p) => p.id));
  const transactions = (await fetchIncluded(earliest, today)).filter((tx) =>
    wanted.has(tx.id),
  );
  return {
    items: await withLabels(transactions),
    // Older than Investec returns, or on an account you've since excluded.
    missing: wanted.size - transactions.length,
  };
}

/** Current balance across the included accounts, live. */
export async function getBalances() {
  await requireSession();
  await connection();
  const ids = await includedAccountIds();
  const balances = await Promise.all(ids.map((id) => getBalance(id)));
  return balances.reduce(
    (sum, b) => ({
      currentMinor: sum.currentMinor + b.currentMinor,
      availableMinor: sum.availableMinor + b.availableMinor,
    }),
    { currentMinor: 0, availableMinor: 0 },
  );
}
