// Pure expense logic shared by the recon, the pages and the tests: no
// database, no network. Amounts are minor units (cents) and always
// positive; `type` says which way the money went.

export const CATEGORY_KINDS = ["spending", "income", "transfer"] as const;
export type CategoryKind = (typeof CATEGORY_KINDS)[number];

export const KIND_LABEL: Record<CategoryKind, string> = {
  spending: "Spending",
  income: "Income",
  transfer: "Transfer (not counted)",
};

export type LabelSource = "rule" | "ai" | "you";

/** A posted Investec transaction, as the app uses it. Never stored. */
export type Transaction = {
  id: string;
  accountId: string;
  /** When it happened (Investec's transactionDate). */
  date: string;
  /** When it reached the account; the month it counts in. */
  postingDate: string;
  type: "DEBIT" | "CREDIT";
  /** Investec's own grouping: CardPurchases, DebitOrders, FeesAndInterest… */
  transactionType: string;
  description: string;
  amountMinor: number;
};

/**
 * "GP SCHEEPERS      65367 BRITS ZA" → "GP SCHEEPERS BRITS": the stable
 * part of a description, so one merchant's transactions group together and
 * rules match all of them. Drops the trailing country code and reference
 * numbers (runs of four or more digits), which change per transaction.
 */
export function merchantKey(description: string): string {
  return description
    .toUpperCase()
    .replace(/\b\d{4,}\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/ [A-Z]{2}$/, "");
}

/** The longest rule pattern that appears in the merchant, so "UBER EATS" beats "UBER". */
export function matchRule<R extends { pattern: string }>(
  description: string,
  rules: R[],
): R | undefined {
  const key = merchantKey(description);
  let best: R | undefined;
  for (const rule of rules) {
    const pattern = merchantKey(rule.pattern);
    if (
      pattern &&
      key.includes(pattern) &&
      pattern.length > (best ? merchantKey(best.pattern).length : 0)
    ) {
      best = rule;
    }
  }
  return best;
}

/**
 * A starting pattern for "always do this": the merchant's first word when
 * it's distinctive ("SUPERSPAR", "TAKEALOT"), else its first two words
 * ("FNB H" → "FNB H LOAN" is still yours to edit).
 */
export function suggestPattern(description: string): string {
  const words = merchantKey(description).split(" ");
  return words[0].length >= 5 ? words[0] : words.slice(0, 2).join(" ");
}

/** "2026-10-14" → "2026-10-01". */
export function monthOf(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

/** The first day of each month from `from` to `to`, inclusive. */
export function monthsBetween(from: string, to: string): string[] {
  const months: string[] = [];
  let [year, month] = from.slice(0, 7).split("-").map(Number);
  const end = to.slice(0, 7);
  for (;;) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    if (key > end) return months;
    months.push(`${key}-01`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
}

/** The last day of a month given its first: "2026-02-01" → "2026-02-28". */
export function monthEnd(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(year, m, 0)).getUTCDate();
  return `${month.slice(0, 8)}${String(last).padStart(2, "0")}`;
}

export type MonthlyTotal = {
  month: string;
  categoryId: string;
  outMinor: number;
  inMinor: number;
  deductibleOutMinor: number;
  count: number;
};

/** Sums labelled transactions per month and category. Unlabelled ones are left out. */
export function monthlyTotals(
  transactions: Transaction[],
  labels: Map<string, { categoryId: string; deductible: boolean }>,
): MonthlyTotal[] {
  const totals = new Map<string, MonthlyTotal>();
  for (const tx of transactions) {
    const label = labels.get(tx.id);
    if (!label) continue;
    const month = monthOf(tx.postingDate);
    const key = `${month}|${label.categoryId}`;
    let total = totals.get(key);
    if (!total) {
      total = {
        month,
        categoryId: label.categoryId,
        outMinor: 0,
        inMinor: 0,
        deductibleOutMinor: 0,
        count: 0,
      };
      totals.set(key, total);
    }
    total.count += 1;
    if (tx.type === "DEBIT") {
      total.outMinor += tx.amountMinor;
      if (label.deductible) total.deductibleOutMinor += tx.amountMinor;
    } else {
      total.inMinor += tx.amountMinor;
    }
  }
  return [...totals.values()];
}

/** What a category cost (spending: out minus refunds) or earned (income: in minus reversals). */
export function netFor(
  kind: CategoryKind,
  total: { outMinor: number; inMinor: number },
): number {
  if (kind === "spending") return total.outMinor - total.inMinor;
  if (kind === "income") return total.inMinor - total.outMinor;
  return 0;
}

export type CategoryTrend = {
  categoryId: string;
  current: number;
  /** Mean of the months before `month` that have any data, up to `window` of them. */
  average: number;
  /** How many months the average is over (0 = nothing to compare with). */
  months: number;
};

/**
 * Each category's net for `month` against its average over the previous
 * `window` months. Months before the first month with any data at all
 * don't count, so a new account isn't compared with empty history.
 */
export function categoryTrends(
  totals: MonthlyTotal[],
  kinds: Map<string, CategoryKind>,
  month: string,
  window = 3,
): CategoryTrend[] {
  const earliest = totals.reduce(
    // biome-ignore lint/complexity/useMathMinMax: ISO date strings, not numbers
    (min, t) => (t.month < min ? t.month : min),
    month,
  );
  const previous = monthsBetween(earliest, month)
    .filter((m) => m < month)
    .slice(-window);
  const byCategory = new Map<string, Map<string, number>>();
  for (const t of totals) {
    const kind = kinds.get(t.categoryId);
    if (!kind || kind === "transfer") continue;
    let months = byCategory.get(t.categoryId);
    if (!months) {
      months = new Map();
      byCategory.set(t.categoryId, months);
    }
    months.set(t.month, (months.get(t.month) ?? 0) + netFor(kind, t));
  }
  return [...byCategory.entries()].map(([categoryId, months]) => ({
    categoryId,
    current: months.get(month) ?? 0,
    average: previous.length
      ? Math.round(
          previous.reduce((sum, m) => sum + (months.get(m) ?? 0), 0) /
            previous.length,
        )
      : 0,
    months: previous.length,
  }));
}

/** Investec's uuid starts with the account's last five digits, then the posting date: read it back. */
export function postingDateFromId(id: string): string | null {
  const match = /^\d{5}(\d{4})(\d{2})(\d{2})\d+$/.exec(id);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

/** South Africa's tax year runs 1 March to the end of February: its first day for a date. */
export function taxYearStart(date: string): string {
  const year = Number(date.slice(0, 4));
  return Number(date.slice(5, 7)) >= 3 ? `${year}-03-01` : `${year - 1}-03-01`;
}
