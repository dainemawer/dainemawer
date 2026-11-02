import type { DisplayStatus, DocumentKind } from "@/lib/documents";
import { type Currency, formatMoney } from "@/lib/money";

// The rules behind the dashboard's "Needs you" list: what counts as
// waiting on you, how it's worded, and in what order. Pure and tested
// (tests/attention.test.ts); lib/attention.ts gathers the data.
//
// A new area joins by adding a builder here and one source in
// lib/attention.ts. The dashboard doesn't change.

export type Urgency = "urgent" | "normal" | "low";

export type AttentionItem = {
  /** Stable across renders: the React key. */
  id: string;
  urgency: Urgency;
  title: string;
  detail?: string;
  href: string;
};

const RANK: Record<Urgency, number> = { urgent: 0, normal: 1, low: 2 };

/** Most urgent first; within one level, the order the sources gave. */
export function sortAttention(items: AttentionItem[]): AttentionItem[] {
  return items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => RANK[a.item.urgency] - RANK[b.item.urgency] || a.i - b.i)
    .map(({ item }) => item);
}

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

function daysBetween(from: string, to: string) {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000,
  );
}

export type DocumentInput = {
  id: string;
  kind: DocumentKind;
  number: string;
  company: string;
  status: DisplayStatus;
  currency: Currency;
  totalMinor: number;
  paidMinor: number;
  dueDate: string | null;
  validUntil: string | null;
  recurringId: string | null;
};

/**
 * Invoices and quotes: each overdue invoice on its own (oldest first,
 * that's money), drafts and expired quotes as one line each.
 */
export function documentItems(
  docs: DocumentInput[],
  today: string,
): AttentionItem[] {
  const items: AttentionItem[] = [];

  const overdue = docs
    .filter((d) => d.kind === "invoice" && d.status === "overdue")
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
  for (const doc of overdue) {
    const days = doc.dueDate ? daysBetween(doc.dueDate, today) : 0;
    items.push({
      id: `overdue-${doc.id}`,
      urgency: "urgent",
      title: `${doc.number} is ${plural(days, "day")} overdue`,
      detail: `${doc.company} · ${formatMoney(doc.totalMinor - doc.paidMinor, doc.currency)} due`,
      href: `/invoices/${doc.id}`,
    });
  }

  const drafts = docs.filter(
    (d) => d.kind === "invoice" && d.status === "draft",
  );
  if (drafts.length) {
    const recurring = drafts.filter((d) => d.recurringId).length;
    items.push({
      id: "invoice-drafts",
      urgency: "normal",
      title: `${plural(drafts.length, "draft invoice")} to send`,
      detail:
        drafts.length === 1
          ? `${drafts[0].number} · ${drafts[0].company}${recurring ? " · recurring" : ""}`
          : recurring
            ? `${recurring} from recurring schedules`
            : drafts.map((d) => d.company).join(", "),
      href:
        drafts.length === 1
          ? `/invoices/${drafts[0].id}`
          : "/invoices?status=draft",
    });
  }

  const expired = docs.filter(
    (d) => d.kind === "quote" && d.status === "expired",
  );
  if (expired.length) {
    items.push({
      id: "quotes-expired",
      urgency: "low",
      title: `${plural(expired.length, "quote")} expired without an answer`,
      detail: expired.map((d) => `${d.number} · ${d.company}`).join(", "),
      href:
        expired.length === 1
          ? `/quotes/${expired[0].id}`
          : "/quotes?status=expired",
    });
  }

  return items;
}

/** Blog posts waiting in pull requests: one line each, they're quick. */
export function postItems(
  pulls: { number: number; title: string; posts: { slug: string }[] }[],
): AttentionItem[] {
  return pulls.map((pull) => ({
    id: `post-${pull.number}`,
    urgency: "normal",
    title: "Post to review",
    detail: `#${pull.number} · ${pull.posts.map((p) => p.slug).join(", ")}`,
    href: `/reviews/${pull.number}`,
  }));
}

/** Transactions the classifier wasn't sure about. */
export function expenseReviewItems(pending: number): AttentionItem[] {
  if (!pending) return [];
  return [
    {
      id: "expense-review",
      urgency: "low",
      title: `${plural(pending, "transaction")} to label`,
      detail: "The classifier wasn't sure",
      href: "/expenses/review",
    },
  ];
}

/** Today's weigh-in, once health tracking has started. */
export function healthItems(health: {
  started: boolean;
  weighedToday: boolean;
}): AttentionItem[] {
  if (!health.started || health.weighedToday) return [];
  return [
    {
      id: "weigh-in",
      urgency: "low",
      title: "No weigh-in today",
      detail: "Send the number to the bot, or log it on Health",
      href: "/health",
    },
  ];
}
