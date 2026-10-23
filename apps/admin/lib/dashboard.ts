import "server-only";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, documents, sends } from "@/db/schema";
import { addDays, todayISO } from "@/lib/documents";
import type { Currency } from "@/lib/money";

// Every money figure is for one currency — totals are never summed across
// currencies (no FX in v1). Definitions match the PRD's analytics section.

const sum = (condition: ReturnType<typeof sql>) =>
  sql<number>`coalesce(sum(${documents.totalMinor}) filter (where ${condition}), 0)`.mapWith(
    Number,
  );
const count = (condition: ReturnType<typeof sql>) =>
  sql<number>`count(*) filter (where ${condition})`.mapWith(Number);

/** Currencies that appear on any document, most used first. */
export async function activeCurrencies(): Promise<Currency[]> {
  const rows = await db
    .select({ currency: documents.currency, n: sql<number>`count(*)` })
    .from(documents)
    .groupBy(documents.currency)
    .orderBy(desc(sql`count(*)`));
  return rows.map((row) => row.currency);
}

export async function headline(currency: Currency) {
  const today = todayISO();
  const monthStart = `${today.slice(0, 7)}-01`;
  const yearStart = `${today.slice(0, 4)}-01-01`;
  const yearAgo = addDays(today, -365);

  const isInvoice = sql`${documents.kind} = 'invoice'`;
  const isQuote = sql`${documents.kind} = 'quote'`;
  const outstanding = sql`${isInvoice} and ${documents.status} = 'sent'`;
  const overdue = sql`${outstanding} and ${documents.dueDate} < ${today}`;
  const paid = sql`${isInvoice} and ${documents.status} = 'paid'`;
  const openQuote = sql`${isQuote} and ${documents.status} = 'sent' and (${documents.validUntil} is null or ${documents.validUntil} >= ${today})`;
  const recentQuote = sql`${isQuote} and ${documents.issueDate} >= ${yearAgo}`;

  const [row] = await db
    .select({
      outstanding: sum(outstanding),
      outstandingCount: count(outstanding),
      overdue: sum(overdue),
      overdueCount: count(overdue),
      paidMonth: sum(sql`${paid} and ${documents.paidAt} >= ${monthStart}`),
      paidYear: sum(sql`${paid} and ${documents.paidAt} >= ${yearStart}`),
      openQuotes: sum(openQuote),
      openQuoteCount: count(openQuote),
      won: count(sql`${recentQuote} and ${documents.status} = 'accepted'`),
      lost: count(
        sql`${recentQuote} and (${documents.status} = 'declined' or (${documents.status} = 'sent' and ${documents.validUntil} < ${today}))`,
      ),
    })
    .from(documents)
    .where(eq(documents.currency, currency));

  const decided = row.won + row.lost;
  return { ...row, winRate: decided ? row.won / decided : null, decided };
}

/** Invoiced (by issue date, excluding drafts and voids) and paid (by paid date), per month for the last 12 months. */
export async function monthly(currency: Currency) {
  const today = todayISO();
  const months: string[] = [];
  const cursor = new Date(`${today.slice(0, 7)}-01T00:00:00Z`);
  for (let i = 11; i >= 0; i--) {
    const d = new Date(cursor);
    d.setUTCMonth(d.getUTCMonth() - i);
    months.push(d.toISOString().slice(0, 7));
  }
  const from = `${months[0]}-01`;

  const [invoiced, paid] = await Promise.all([
    db
      .select({
        month: sql<string>`to_char(${documents.issueDate}, 'YYYY-MM')`,
        total: sql<number>`sum(${documents.totalMinor})`.mapWith(Number),
      })
      .from(documents)
      .where(
        and(
          eq(documents.kind, "invoice"),
          eq(documents.currency, currency),
          sql`${documents.status} not in ('draft', 'void')`,
          gte(documents.issueDate, from),
        ),
      )
      .groupBy(sql`1`),
    db
      .select({
        month: sql<string>`to_char(${documents.paidAt}, 'YYYY-MM')`,
        total: sql<number>`sum(${documents.totalMinor})`.mapWith(Number),
      })
      .from(documents)
      .where(
        and(
          eq(documents.kind, "invoice"),
          eq(documents.currency, currency),
          eq(documents.status, "paid"),
          gte(documents.paidAt, from),
        ),
      )
      .groupBy(sql`1`),
  ]);

  const invoicedBy = new Map(invoiced.map((r) => [r.month, r.total]));
  const paidBy = new Map(paid.map((r) => [r.month, r.total]));
  return months.map((month) => ({
    month,
    invoiced: invoicedBy.get(month) ?? 0,
    paid: paidBy.get(month) ?? 0,
  }));
}

export async function overdueInvoices(currency: Currency) {
  return db
    .select({ document: documents, company: customers.company })
    .from(documents)
    .innerJoin(customers, eq(customers.id, documents.customerId))
    .where(
      and(
        eq(documents.kind, "invoice"),
        eq(documents.status, "sent"),
        eq(documents.currency, currency),
        sql`${documents.dueDate} < ${todayISO()}`,
      ),
    )
    .orderBy(documents.dueDate);
}

export async function awaitingQuotes(currency: Currency) {
  return db
    .select({ document: documents, company: customers.company })
    .from(documents)
    .innerJoin(customers, eq(customers.id, documents.customerId))
    .where(
      and(
        eq(documents.kind, "quote"),
        eq(documents.status, "sent"),
        eq(documents.currency, currency),
        sql`(${documents.validUntil} is null or ${documents.validUntil} >= ${todayISO()})`,
      ),
    )
    .orderBy(documents.validUntil);
}

export async function topCustomers(currency: Currency) {
  const yearStart = `${todayISO().slice(0, 4)}-01-01`;
  return db
    .select({
      id: customers.id,
      company: customers.company,
      paid: sql<number>`sum(${documents.totalMinor})`.mapWith(Number),
    })
    .from(documents)
    .innerJoin(customers, eq(customers.id, documents.customerId))
    .where(
      and(
        eq(documents.kind, "invoice"),
        eq(documents.status, "paid"),
        eq(documents.currency, currency),
        gte(documents.paidAt, yearStart),
      ),
    )
    .groupBy(customers.id, customers.company)
    .orderBy(desc(sql`sum(${documents.totalMinor})`))
    .limit(5);
}

export type Activity = {
  at: string;
  kind: "sent" | "paid" | "accepted" | "declined";
  documentId: string;
  number: string;
  documentKind: "quote" | "invoice";
  company: string;
  totalMinor: number;
  currency: Currency;
};

/** The latest sends, payments and quote decisions, newest first. */
export async function recentActivity(limit = 10): Promise<Activity[]> {
  const [sent, decided] = await Promise.all([
    db
      .select({ send: sends, document: documents, company: customers.company })
      .from(sends)
      .innerJoin(documents, eq(documents.id, sends.documentId))
      .innerJoin(customers, eq(customers.id, documents.customerId))
      .orderBy(desc(sends.sentAt))
      .limit(limit),
    db
      .select({ document: documents, company: customers.company })
      .from(documents)
      .innerJoin(customers, eq(customers.id, documents.customerId))
      .where(sql`${documents.status} in ('paid', 'accepted', 'declined')`)
      .orderBy(desc(documents.updatedAt))
      .limit(limit),
  ]);

  const base = (d: typeof documents.$inferSelect, company: string) => ({
    documentId: d.id,
    number: d.number,
    documentKind: d.kind,
    company,
    totalMinor: d.totalMinor,
    currency: d.currency,
  });

  const events: Activity[] = [
    ...sent.map((r) => ({
      ...base(r.document, r.company),
      at: r.send.sentAt.toISOString(),
      kind: "sent" as const,
    })),
    ...decided.flatMap((r): Activity[] => {
      const d = r.document;
      const at =
        d.status === "paid"
          ? d.paidAt && `${d.paidAt}T12:00:00Z`
          : d.status === "accepted"
            ? d.acceptedAt?.toISOString()
            : d.declinedAt?.toISOString();
      if (!at) return [];
      return [
        {
          ...base(d, r.company),
          at,
          kind: d.status as "paid" | "accepted" | "declined",
        },
      ];
    }),
  ];
  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
