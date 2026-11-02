import { formatDate } from "@/lib/documents";
import {
  type CategoryKind,
  merchantKey,
  type Transaction,
} from "@/lib/expenses/transactions";
import { formatMoney } from "@/lib/money";
import type { TelegramMessage } from "@/lib/telegram-format";

// What the daily expenses sync tells you on Telegram (lib/expenses/recon.ts
// sends it). Pure and tested in tests/expenses-digest.test.ts.
//
// Mondays: one summary of the last seven days. Other days: a message only
// when a newly synced charge looks off (a possible duplicate, or one charge
// bigger than a usual month in its category). Everything else, including
// how many wait to be labelled, is on the dashboard's "Needs you" list.

/** A charge needs to be at least this big to count as unusual (R500). */
export const LARGE_FLOOR_MINOR = 50_000;

export type DigestRow = {
  transaction: Transaction;
  category: { id: string; name: string; kind: CategoryKind } | null;
};

/** Monday in the given ISO date. */
export const isDigestDay = (today: string) =>
  new Date(`${today}T00:00:00Z`).getUTCDay() === 1;

const money = (minor: number) => formatMoney(minor, "ZAR");

const isSpend = (row: DigestRow) =>
  row.transaction.type === "DEBIT" && row.category?.kind === "spending";

export type ChargeFlags = {
  duplicates: Transaction[][];
  large: { transaction: Transaction; category: string; averageMinor: number }[];
};

/**
 * Charges worth a second look. `averages` is each category's usual month
 * (categoryId → minor units); a category with no history has no entry and
 * never flags a large charge.
 */
export function chargeFlags(
  rows: DigestRow[],
  averages: Map<string, number>,
): ChargeFlags {
  const seen = new Map<string, Transaction[]>();
  for (const { transaction: tx } of rows) {
    if (tx.type !== "DEBIT") continue;
    const key = `${merchantKey(tx.description)}|${tx.amountMinor}|${tx.date}`;
    seen.set(key, [...(seen.get(key) ?? []), tx]);
  }
  const duplicates = [...seen.values()].filter((group) => group.length > 1);

  const large = rows.flatMap((row) => {
    if (!isSpend(row) || !row.category) return [];
    const average = averages.get(row.category.id);
    if (!average) return [];
    const amount = row.transaction.amountMinor;
    return amount >= Math.max(average, LARGE_FLOOR_MINOR)
      ? [
          {
            transaction: row.transaction,
            category: row.category.name,
            averageMinor: average,
          },
        ]
      : [];
  });
  return { duplicates, large };
}

const flagLines = ({ duplicates, large }: ChargeFlags) => [
  ...duplicates.map(
    (group) =>
      `Possible duplicate: ${group.length} × ${money(group[0].amountMinor)} · ${group[0].description} (${formatDate(group[0].date)})`,
  ),
  ...large.map(
    (flag) =>
      `Large: ${money(flag.transaction.amountMinor)} · ${flag.transaction.description} (${formatDate(flag.transaction.date)}), a usual month of ${flag.category} is ${money(flag.averageMinor)}`,
  ),
];

/** A weekday's message, or null when nothing looks off. */
export function flagsMessage(
  flags: ChargeFlags,
  url: string,
): TelegramMessage | null {
  const lines = flagLines(flags);
  if (!lines.length) return null;
  return {
    title: `Expenses: ${lines.length === 1 ? "one charge" : `${lines.length} charges`} worth a look`,
    lines,
    url,
  };
}

/** Monday's summary of `rows`: the last seven days' transactions. */
export function weeklyMessage({
  rows,
  flags,
  today,
  monthName,
  spentThisMonth,
  averageMonth,
  toLabel,
  url,
}: {
  rows: DigestRow[];
  flags: ChargeFlags;
  today: string;
  monthName: string;
  spentThisMonth: number;
  averageMonth: number;
  toLabel: number;
  url: string;
}): TelegramMessage {
  let out = 0;
  let incoming = 0;
  const perCategory = new Map<string, number>();
  for (const { transaction: tx, category } of rows) {
    if (!category || category.kind === "transfer") continue;
    if (tx.type === "DEBIT") out += tx.amountMinor;
    else incoming += tx.amountMinor;
    if (category.kind === "spending") {
      const signed = tx.type === "DEBIT" ? tx.amountMinor : -tx.amountMinor;
      perCategory.set(
        category.name,
        (perCategory.get(category.name) ?? 0) + signed,
      );
    }
  }
  const top = [...perCategory.entries()]
    .filter(([, minor]) => minor > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const largest = rows
    .filter(isSpend)
    .map((r) => r.transaction)
    .sort((a, b) => b.amountMinor - a.amountMinor)
    .slice(0, 3);

  return {
    title: `Expenses, week to ${formatDate(today)}: ${money(out)} out, ${money(incoming)} in`,
    lines: [
      top.length
        ? `Most on: ${top.map(([name, minor]) => `${name} ${money(minor)}`).join(" · ")}`
        : null,
      ...largest.map(
        (tx) => `Largest: ${money(tx.amountMinor)} · ${tx.description}`,
      ),
      ...flagLines(flags),
      `${monthName} so far: ${money(spentThisMonth)} spent${averageMonth ? `, you average ${money(averageMonth)} a month` : ""}`,
      toLabel
        ? `${toLabel} transaction${toLabel === 1 ? "" : "s"} to label`
        : null,
    ],
    url,
  };
}
