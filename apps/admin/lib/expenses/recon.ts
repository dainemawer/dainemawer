import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  expenseAccounts,
  expenseCategories,
  expenseLabels,
  expenseMonthly,
  expenseNotes,
  expenseRules,
  expenseSubscriptions,
} from "@/db/schema";
import { addDays, formatDate, todayISO } from "@/lib/documents";
import {
  classifyMerchants,
  type Merchant,
  REVIEW_THRESHOLD,
} from "@/lib/expenses/ai";
import { getAllTransactions, listAccounts } from "@/lib/expenses/investec";
import {
  findSubscriptions,
  subscriptionAlerts,
} from "@/lib/expenses/subscriptions";
import {
  categoryTrends,
  matchRule,
  merchantKey,
  monthEnd,
  monthlyTotals,
  monthOf,
  monthsBetween,
  netFor,
  type Transaction,
} from "@/lib/expenses/transactions";
import { formatMoney } from "@/lib/money";
import { sendTelegram } from "@/lib/telegram";

// The expenses pipeline. Everything here is idempotent: labels are only
// ever inserted for transactions that have none (a second concurrent run
// inserts nothing), and monthly totals are recomputed from Investec rather
// than incremented, so running it twice, or after a correction, can't
// double count.

/** How far back the first sync, and corrections, reach: Investec's default history. */
export const HISTORY_DAYS = 180;
/**
 * Totals are grouped by posting date, but Investec filters by purchase date,
 * so a fetch for a month starts this many days early to catch purchases
 * that posted inside it.
 */
const POSTING_LAG_DAYS = 14;

/** Refreshes the account list from Investec. New accounts start excluded, except the main Private Bank account. */
export async function syncAccounts() {
  const accounts = await listAccounts();
  for (const account of accounts) {
    await db
      .insert(expenseAccounts)
      .values({
        ...account,
        included: account.productName === "Private Bank Account",
      })
      .onConflictDoUpdate({
        target: expenseAccounts.accountId,
        set: { name: account.name, productName: account.productName },
      });
  }
  return accounts;
}

export async function includedAccountIds() {
  const rows = await db
    .select({ id: expenseAccounts.accountId })
    .from(expenseAccounts)
    .where(eq(expenseAccounts.included, true));
  return rows.map((row) => row.id);
}

export async function fetchIncluded(fromDate: string, toDate: string) {
  const ids = await includedAccountIds();
  return ids.length ? getAllTransactions(ids, fromDate, toDate) : [];
}

/** Groups transactions by merchant for the AI: one entry per merchant and direction. */
export function merchantsOf(transactions: Transaction[]): Merchant[] {
  const merchants = new Map<string, Merchant>();
  for (const tx of transactions) {
    const key = merchantKey(tx.description);
    const merchant = merchants.get(key);
    if (merchant) merchant.count += 1;
    else {
      merchants.set(key, {
        description: tx.description,
        type: tx.type,
        transactionType: tx.transactionType,
        amountMinor: tx.amountMinor,
        count: 1,
      });
    }
  }
  return [...merchants.values()].sort((a, b) => b.count - a.count);
}

type Labelled = { transaction: Transaction; needsReview: boolean };

/**
 * Labels every transaction that has no label yet: your rules first, then
 * the AI for what's left. Returns what it labelled.
 */
export async function labelTransactions(
  transactions: Transaction[],
): Promise<Labelled[]> {
  if (!transactions.length) return [];
  const [categories, rules, notes, existing] = await Promise.all([
    db
      .select()
      .from(expenseCategories)
      .orderBy(asc(expenseCategories.position)),
    db
      .select({ rule: expenseRules, category: expenseCategories.name })
      .from(expenseRules)
      .innerJoin(
        expenseCategories,
        eq(expenseCategories.id, expenseRules.categoryId),
      ),
    db.select({ body: expenseNotes.body }).from(expenseNotes),
    db
      .select({ id: expenseLabels.transactionId })
      .from(expenseLabels)
      .where(
        inArray(
          expenseLabels.transactionId,
          transactions.map((tx) => tx.id),
        ),
      ),
  ]);
  if (!categories.length) return [];
  const done = new Set(existing.map((row) => row.id));
  const fresh = transactions.filter((tx) => !done.has(tx.id));
  if (!fresh.length) return [];

  const ruleList = rules.map(({ rule }) => rule);
  const byRule: Transaction[] = [];
  const forAi: Transaction[] = [];
  for (const tx of fresh)
    (matchRule(tx.description, ruleList) ? byRule : forAi).push(tx);

  const byName = new Map(categories.map((c) => [c.name, c]));
  const classified = await classifyMerchants(merchantsOf(forAi), {
    categories,
    rules: rules.map(({ rule, category }) => ({
      pattern: rule.pattern,
      category,
      deductible: rule.deductible,
    })),
    notes: notes.map((note) => note.body),
  });

  const rows: (typeof expenseLabels.$inferInsert)[] = [];
  const labelled: Labelled[] = [];
  for (const tx of byRule) {
    const rule = matchRule(tx.description, ruleList);
    if (!rule) continue;
    rows.push({
      transactionId: tx.id,
      accountId: tx.accountId,
      categoryId: rule.categoryId,
      deductible: rule.deductible && tx.type === "DEBIT",
      source: "rule",
      needsReview: false,
    });
    labelled.push({ transaction: tx, needsReview: false });
  }
  for (const tx of forAi) {
    const result = classified.get(merchantKey(tx.description));
    const category = result && byName.get(result.category);
    if (!result || !category) continue;
    const needsReview = result.confidence < REVIEW_THRESHOLD;
    rows.push({
      transactionId: tx.id,
      accountId: tx.accountId,
      categoryId: category.id,
      deductible: result.deductible && tx.type === "DEBIT",
      source: "ai",
      confidence: result.confidence,
      needsReview,
    });
    labelled.push({ transaction: tx, needsReview });
  }
  if (!rows.length) return [];
  const inserted = await db
    .insert(expenseLabels)
    .values(rows)
    .onConflictDoNothing()
    .returning({ id: expenseLabels.transactionId });
  // Another run may have labelled some first; only report ours.
  const ours = new Set(inserted.map((row) => row.id));
  return labelled.filter(({ transaction }) => ours.has(transaction.id));
}

/**
 * Recomputes the stored totals for these months from Investec. Only months
 * that start inside the history window: the month the window starts in is
 * cut off part-way (it would drag every average down), and older months
 * keep what's stored, so the history outlives the API's window. A month
 * Investec returns nothing for is left alone too.
 *
 * `window` is the included accounts' transactions over the whole history
 * window, for callers that just fetched them; otherwise the months are read
 * in one request rather than one per month.
 */
export async function recomputeMonths(
  months: string[],
  today = todayISO(),
  window?: Transaction[],
) {
  const earliest = addDays(today, -HISTORY_DAYS);
  const wanted = [...new Set(months)].filter((m) => m >= earliest).sort();
  if (!wanted.length) return;
  let transactions = window;
  if (!transactions) {
    const ids = await includedAccountIds();
    if (!ids.length) return;
    transactions = await getAllTransactions(
      ids,
      addDays(wanted[0], -POSTING_LAG_DAYS),
      monthEnd(wanted[wanted.length - 1]),
    );
  }
  const inRange = transactions.filter((tx) =>
    wanted.includes(monthOf(tx.postingDate)),
  );
  if (!inRange.length) return;
  const labels = await db
    .select()
    .from(expenseLabels)
    .where(
      inArray(
        expenseLabels.transactionId,
        inRange.map((tx) => tx.id),
      ),
    );
  const totals = monthlyTotals(
    inRange,
    new Map(labels.map((label) => [label.transactionId, label])),
  );
  const seen = new Set(inRange.map((tx) => monthOf(tx.postingDate)));
  await db.transaction(async (tx) => {
    for (const month of wanted) {
      if (!seen.has(month)) continue;
      const rows = totals.filter((total) => total.month === month);
      await tx.delete(expenseMonthly).where(eq(expenseMonthly.month, month));
      if (rows.length) await tx.insert(expenseMonthly).values(rows);
    }
  });
}

/** The first sync, or after including another account: labels and totals for the whole history window. */
export async function backfill(today = todayISO()) {
  const from = addDays(today, -HISTORY_DAYS);
  const transactions = await fetchIncluded(from, today);
  const labelled = await labelTransactions(transactions);
  await recomputeMonths(monthsBetween(from, today), today, transactions);
  return { labelled, transactions, from };
}

/**
 * Monthly charges in the history window, each with its category and what
 * you've said about it. Transfers and income are left out: a monthly move
 * to savings isn't a subscription.
 */
export async function detectSubscriptions(
  transactions: Transaction[],
  from: string,
  today: string,
) {
  const debits = transactions.filter((tx) => tx.type === "DEBIT");
  const [labels, categories, states] = await Promise.all([
    debits.length
      ? db
          .select({
            id: expenseLabels.transactionId,
            categoryId: expenseLabels.categoryId,
          })
          .from(expenseLabels)
          .where(
            inArray(
              expenseLabels.transactionId,
              debits.map((tx) => tx.id),
            ),
          )
      : [],
    db.select().from(expenseCategories),
    db.select().from(expenseSubscriptions),
  ]);
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const categoryOf = new Map(
    labels.map((l) => [l.id, categoryById.get(l.categoryId)]),
  );
  const spending = debits.filter((tx) => {
    const kind = categoryOf.get(tx.id)?.kind;
    return kind !== "transfer" && kind !== "income";
  });
  const stateByKey = new Map(states.map((s) => [s.key, s]));
  const subscriptions = findSubscriptions(spending, { from, today }).map(
    (subscription) => ({
      ...subscription,
      category: categoryOf.get(subscription.lastTransactionId)?.name ?? null,
      state: stateByKey.get(subscription.key) ?? null,
    }),
  );
  return { subscriptions, states };
}

/** New subscriptions, price rises and charges after cancelling, to Telegram. */
async function checkSubscriptions(
  transactions: Transaction[],
  from: string,
  today: string,
  notify: boolean,
) {
  const { subscriptions, states } = await detectSubscriptions(
    transactions,
    from,
    today,
  );
  const { alerts, upserts } = subscriptionAlerts(subscriptions, states);
  for (const state of upserts) {
    await db
      .insert(expenseSubscriptions)
      .values(state)
      .onConflictDoUpdate({
        target: expenseSubscriptions.key,
        set: {
          notifiedMinor: state.notifiedMinor,
          alertedChargeOn: state.alertedChargeOn,
        },
      });
  }
  if (!notify || !alerts.length) return alerts.length;
  const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3001";
  const money = (minor: number) => formatMoney(minor, "ZAR");
  await sendTelegram(
    {
      title: "Subscriptions",
      lines: alerts.map((alert) => {
        const { merchant, amountMinor, lastDate } = alert.subscription;
        if (alert.kind === "new") {
          return `New: ${merchant}, ${money(amountMinor)} a month`;
        }
        if (alert.kind === "price") {
          return `Price up: ${merchant}, ${money(alert.fromMinor)} → ${money(amountMinor)} a month`;
        }
        return `Charged after you cancelled: ${merchant}, ${money(amountMinor)} on ${formatDate(lastDate)}`;
      }),
      url: `${base}/expenses/subscriptions`,
    },
    // A charge after cancelling is worth a buzz; the rest can wait.
    { quiet: !alerts.some((alert) => alert.kind === "after-cancel") },
  );
  return alerts.length;
}

/**
 * The daily run (app/api/cron/expenses): label what's new and send a
 * summary to Telegram. It reads the whole history window (one request per
 * account), so a missed run, a late-posting card or an earlier failed AI
 * call is caught up, and every month's totals are recomputed from scratch.
 */
export async function runRecon({
  notify = true,
  today = todayISO(),
}: {
  notify?: boolean;
  today?: string;
} = {}) {
  const [category] = await db
    .select({ id: expenseCategories.id })
    .from(expenseCategories)
    .limit(1);
  if (!category)
    return { skipped: "Expenses aren't set up yet.", labelled: 0, review: 0 };

  await syncAccounts();
  const { labelled, transactions, from } = await backfill(today);
  const review = labelled.filter((l) => l.needsReview).length;
  if (notify && labelled.length) await sendSummary(labelled, today);
  // Never fails the sync: the labels and totals are already saved.
  let alerted = 0;
  try {
    alerted = await checkSubscriptions(transactions, from, today, notify);
  } catch (error) {
    console.error("[expenses] subscription check failed", error);
  }
  return {
    skipped: null,
    labelled: labelled.length,
    review,
    subscriptionAlerts: alerted,
  };
}

async function sendSummary(labelled: Labelled[], today: string) {
  const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3001";
  const money = (minor: number) => formatMoney(minor, "ZAR");
  const ids = labelled.map((l) => l.transaction.id);
  const [labels, categories, pending, monthly] = await Promise.all([
    db
      .select()
      .from(expenseLabels)
      .where(inArray(expenseLabels.transactionId, ids)),
    db.select().from(expenseCategories),
    db
      .select({ id: expenseLabels.transactionId })
      .from(expenseLabels)
      .where(eq(expenseLabels.needsReview, true)),
    db
      .select()
      .from(expenseMonthly)
      .where(
        inArray(
          expenseMonthly.month,
          monthsBetween(addDays(today, -125), today),
        ),
      ),
  ]);
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const labelById = new Map(labels.map((l) => [l.transactionId, l]));

  let out = 0;
  let incoming = 0;
  const perCategory = new Map<string, number>();
  for (const { transaction } of labelled) {
    const label = labelById.get(transaction.id);
    const category = label && categoryById.get(label.categoryId);
    if (!category || category.kind === "transfer") continue;
    const signed =
      transaction.type === "DEBIT"
        ? transaction.amountMinor
        : -transaction.amountMinor;
    if (transaction.type === "DEBIT") out += transaction.amountMinor;
    else incoming += transaction.amountMinor;
    if (category.kind === "spending") {
      perCategory.set(
        category.name,
        (perCategory.get(category.name) ?? 0) + signed,
      );
    }
  }

  const largest = labelled
    .map((l) => l.transaction)
    .filter((tx) => {
      const label = labelById.get(tx.id);
      return (
        tx.type === "DEBIT" &&
        categoryById.get(label?.categoryId ?? "")?.kind === "spending"
      );
    })
    .sort((a, b) => b.amountMinor - a.amountMinor)
    .slice(0, 5);

  // Same merchant, amount and day: worth a second look.
  const seen = new Map<string, Transaction[]>();
  for (const { transaction: tx } of labelled) {
    if (tx.type !== "DEBIT") continue;
    const key = `${merchantKey(tx.description)}|${tx.amountMinor}|${tx.date}`;
    seen.set(key, [...(seen.get(key) ?? []), tx]);
  }
  const duplicates = [...seen.values()].filter((group) => group.length > 1);

  const month = monthOf(today);
  const kinds = new Map(categories.map((c) => [c.id, c.kind]));
  const trends = categoryTrends(monthly, kinds, month);
  const spentThisMonth = monthly
    .filter((t) => t.month === month && kinds.get(t.categoryId) === "spending")
    .reduce((sum, t) => sum + netFor("spending", t), 0);
  const average = trends
    .filter((t) => kinds.get(t.categoryId) === "spending")
    .reduce((sum, t) => sum + t.average, 0);
  const monthName = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${month}T00:00:00Z`));

  const lines = [
    `${monthName} so far: ${money(spentThisMonth)} spent${average ? `, you average ${money(average)} a month` : ""}`,
    perCategory.size
      ? `By category: ${[...perCategory.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([name, minor]) => `${name} ${money(minor)}`)
          .join(" · ")}`
      : null,
    ...largest.map(
      (tx) =>
        `Largest: ${money(tx.amountMinor)} · ${tx.description} (${tx.date})`,
    ),
    ...duplicates.map(
      (group) =>
        `Possible duplicate: ${group.length} × ${money(group[0].amountMinor)} · ${group[0].description} (${group[0].date})`,
    ),
    pending.length
      ? `${pending.length} transaction${pending.length === 1 ? "" : "s"} to review`
      : null,
  ];

  await sendTelegram(
    {
      title: `Expenses: ${labelled.length} new · ${money(out)} out, ${money(incoming)} in`,
      lines,
      url: pending.length ? `${base}/expenses/review` : `${base}/expenses`,
    },
    { quiet: true },
  );
}
