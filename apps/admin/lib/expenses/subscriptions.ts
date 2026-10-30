// Subscriptions, found in the card and debit-order history: a merchant that
// charges about the same amount about once a month. Pure (no database, no
// Investec), so the tests can import it. Investec gives 180 days of
// history, so only monthly charges can be found; a yearly one never repeats
// inside the window.

import { addDays } from "@/lib/documents";
import { merchantKey, type Transaction } from "@/lib/expenses/transactions";

/** Charges needed before a merchant counts: three is two monthly gaps. */
export const MIN_CHARGES = 3;
/** Amounts within this share of each other are one subscription. */
const SAME_AMOUNT = 0.25;
/** A charge this much above the one before is a price rise. */
const PRICE_RISE = 0.02;
/** Days past the expected charge before it looks stopped. */
const GRACE_DAYS = 10;

export type Subscription = {
  /** Stable id: the merchant, plus the usual amount when one merchant has two. */
  key: string;
  merchant: string;
  /** The last charge's description, as the bank shows it. */
  description: string;
  /** The latest charge: what it costs a month now. */
  amountMinor: number;
  /** The charge before it. */
  previousMinor: number;
  charges: number;
  firstDate: string;
  lastDate: string;
  /** The last charge plus the usual gap. */
  nextDate: string;
  /** The latest charge's transaction, for its category. */
  lastTransactionId: string;
  priceRise: boolean;
  /** First charged inside the window, after a stretch with nothing. */
  isNew: boolean;
  /** The next charge is overdue: cancelled, or moved to another card. */
  stopped: boolean;
};

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

const daysBetween = (from: string, to: string) =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000,
  );

/** Splits one merchant's charges into groups of similar amounts. */
function byAmount(charges: Transaction[]): Transaction[][] {
  const groups: Transaction[][] = [];
  for (const tx of [...charges].sort((a, b) => a.amountMinor - b.amountMinor)) {
    const group = groups.at(-1);
    if (group && tx.amountMinor <= group[0].amountMinor * (1 + SAME_AMOUNT)) {
      group.push(tx);
    } else {
      groups.push([tx]);
    }
  }
  return groups;
}

/**
 * Monthly charges in `transactions` (debits only: pass what you want
 * considered, e.g. without transfers). `from` is where the history window
 * starts; a merchant first seen well after the earliest transaction in it
 * counts as new.
 */
export function findSubscriptions(
  transactions: Transaction[],
  { from, today }: { from: string; today: string },
): Subscription[] {
  // Where the history really starts: an account with less than the full
  // window would otherwise make every subscription look new.
  const earliest = transactions.reduce(
    // biome-ignore lint/complexity/useMathMinMax: ISO date strings, not numbers
    (min, tx) => (tx.date < min ? tx.date : min),
    today,
  );
  const start = earliest > from ? earliest : from;
  const merchants = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    if (tx.type !== "DEBIT") continue;
    const key = merchantKey(tx.description);
    merchants.set(key, [...(merchants.get(key) ?? []), tx]);
  }

  const found: Subscription[] = [];
  for (const [merchant, charges] of merchants) {
    const groups = byAmount(charges).filter((g) => g.length >= MIN_CHARGES);
    for (const group of groups) {
      const dated = [...group].sort((a, b) => a.date.localeCompare(b.date));
      const gaps = dated
        .slice(1)
        .map((tx, i) => daysBetween(dated[i].date, tx.date));
      const gap = median(gaps);
      // Monthly: the usual gap is a month, and nearly every gap is.
      if (gap < 26 || gap > 35) continue;
      const monthly = gaps.filter((g) => g >= 24 && g <= 38).length;
      if (monthly < Math.ceil(gaps.length * 0.75)) continue;

      const last = dated.at(-1) as Transaction;
      const previous = dated.at(-2) as Transaction;
      const first = dated[0];
      const nextDate = addDays(last.date, gap);
      found.push({
        key:
          groups.length > 1
            ? `${merchant} ~R${Math.round(median(group.map((t) => t.amountMinor)) / 100)}`
            : merchant,
        merchant,
        description: last.description,
        amountMinor: last.amountMinor,
        previousMinor: previous.amountMinor,
        charges: dated.length,
        firstDate: first.date,
        lastDate: last.date,
        nextDate,
        lastTransactionId: last.id,
        priceRise:
          last.amountMinor > previous.amountMinor * (1 + PRICE_RISE) &&
          last.amountMinor - previous.amountMinor >= 100,
        isNew: daysBetween(start, first.date) > 45,
        stopped: daysBetween(nextDate, today) > GRACE_DAYS,
      });
    }
  }
  return found.sort((a, b) => b.amountMinor - a.amountMinor);
}

/** What the subscriptions cost: per month and per year, the stopped ones left out. */
export function subscriptionTotals(subscriptions: Subscription[]) {
  const monthlyMinor = subscriptions
    .filter((s) => !s.stopped)
    .reduce((sum, s) => sum + s.amountMinor, 0);
  return { monthlyMinor, yearlyMinor: monthlyMinor * 12 };
}

export type SubscriptionStatus = "tracking" | "ignored" | "cancelled";

export type SubscriptionState = {
  key: string;
  status: SubscriptionStatus;
  /** The amount last told about on Telegram. */
  notifiedMinor: number | null;
  /** When you marked it cancelled (ISO date). */
  cancelledOn: string | null;
  /** The charge after cancelling already told about, so it's told once. */
  alertedChargeOn: string | null;
};

export type SubscriptionAlert =
  | { kind: "new"; subscription: Subscription }
  | { kind: "price"; subscription: Subscription; fromMinor: number }
  | { kind: "after-cancel"; subscription: Subscription };

/**
 * What's worth a Telegram note since the last run, and the state to store.
 * The first run (nothing stored) records everything quietly, so turning
 * this on doesn't announce every existing subscription.
 */
export function subscriptionAlerts(
  subscriptions: Subscription[],
  states: SubscriptionState[],
): { alerts: SubscriptionAlert[]; upserts: SubscriptionState[] } {
  const known = new Map(states.map((s) => [s.key, s]));
  const firstRun = states.length === 0;
  const alerts: SubscriptionAlert[] = [];
  const upserts: SubscriptionState[] = [];
  for (const subscription of subscriptions) {
    const state = known.get(subscription.key);
    if (!state) {
      upserts.push({
        key: subscription.key,
        status: "tracking",
        notifiedMinor: subscription.amountMinor,
        cancelledOn: null,
        alertedChargeOn: null,
      });
      if (!firstRun && !subscription.stopped) {
        alerts.push({ kind: "new", subscription });
      }
      continue;
    }
    if (state.status === "ignored") continue;
    if (state.status === "cancelled") {
      // Charged again after you cancelled it: tell once per charge.
      if (
        state.cancelledOn &&
        subscription.lastDate > state.cancelledOn &&
        subscription.lastDate !== state.alertedChargeOn
      ) {
        alerts.push({ kind: "after-cancel", subscription });
        upserts.push({ ...state, alertedChargeOn: subscription.lastDate });
      }
      continue;
    }
    const told = state.notifiedMinor ?? subscription.amountMinor;
    if (subscription.amountMinor > told * (1 + PRICE_RISE)) {
      alerts.push({ kind: "price", subscription, fromMinor: told });
    }
    if (subscription.amountMinor !== state.notifiedMinor) {
      upserts.push({ ...state, notifiedMinor: subscription.amountMinor });
    }
  }
  return { alerts, upserts };
}
