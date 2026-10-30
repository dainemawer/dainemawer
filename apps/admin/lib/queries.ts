import "server-only";
import { asc, desc, eq, isNull, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import {
  customers,
  documents,
  lineItems,
  payments,
  recurringInvoices,
  recurringLines,
  sends,
  settings,
} from "@/db/schema";
import { TAG } from "@/lib/cache-tags";
import {
  addDays,
  type DisplayStatus,
  type DocumentKind,
  displayStatus,
} from "@/lib/documents";
import { type AmountsByCurrency, addAmount } from "@/lib/money";
import { recurringStatus } from "@/lib/recurring-dates";
import { requireSession } from "@/lib/session";
import { getToday } from "@/lib/today";

// The data access layer: every read the app makes. Each export checks the
// session first, then calls a cached query, so no page can read data
// without a signed-in user however it's structured, and nothing here can
// end up in a prerendered static shell (the session check is request-time).
//
// The cached queries use `use cache: remote` (on Vercel, the shared runtime
// cache): the default in-memory cache rarely survives between serverless
// requests, and a hit also spares Neon waking from idle. Writes expire the
// tags (lib/cache-tags.ts). Anything that depends on today's date is
// derived outside the cache, or takes `today` as an argument so it's part
// of the key.

/** Shared by every cached query below. */
function cached(...tags: string[]) {
  cacheTag(...tags);
  cacheLife("hours");
}

export async function getSettings() {
  await requireSession();
  return cachedSettings();
}

async function cachedSettings() {
  "use cache: remote";
  cached(TAG.settings);
  const [row] = await db.select().from(settings).where(eq(settings.id, 1));
  if (row) return row;
  // First request on a fresh database: create the defaults row.
  const [created] = await db
    .insert(settings)
    .values({ id: 1 })
    .onConflictDoNothing()
    .returning();
  return created ?? (await db.select().from(settings))[0];
}

export async function listCustomers({ archived = false } = {}) {
  await requireSession();
  return cachedCustomers(archived);
}

async function cachedCustomers(archived: boolean) {
  "use cache: remote";
  cached(TAG.customers, TAG.documents);
  const [rows, totals] = await Promise.all([
    db
      .select()
      .from(customers)
      .where(
        archived
          ? sql`${customers.archivedAt} is not null`
          : isNull(customers.archivedAt),
      )
      .orderBy(asc(customers.company)),
    // Grouped by currency too: a customer billed in two currencies gets
    // two figures, never one sum in the wrong currency.
    db
      .select({
        customerId: documents.customerId,
        currency: documents.currency,
        outstanding:
          sql<number>`coalesce(sum(${documents.totalMinor}) filter (where ${documents.status} = 'sent'), 0)`.mapWith(
            Number,
          ),
        paid: sql<number>`coalesce(sum(${documents.totalMinor}) filter (where ${documents.status} = 'paid'), 0)`.mapWith(
          Number,
        ),
      })
      .from(documents)
      .where(eq(documents.kind, "invoice"))
      .groupBy(documents.customerId, documents.currency),
  ]);

  return rows.map((customer) => {
    let outstanding: AmountsByCurrency = {};
    let paid: AmountsByCurrency = {};
    for (const t of totals) {
      if (t.customerId !== customer.id) continue;
      outstanding = addAmount(outstanding, t.currency, t.outstanding);
      paid = addAmount(paid, t.currency, t.paid);
    }
    return { customer, outstanding, paid };
  });
}

export async function getCustomer(id: string) {
  await requireSession();
  return cachedCustomer(id);
}

async function cachedCustomer(id: string) {
  "use cache: remote";
  cached(TAG.customers);
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id));
  return customer ?? null;
}

export type DocumentRow = Awaited<ReturnType<typeof listDocuments>>[number];

export async function listDocuments(kind: DocumentKind) {
  await requireSession();
  const today = await getToday();
  return (await cachedDocuments(kind)).map((row) => ({
    ...row,
    status: displayStatus(row.document, today),
  }));
}

async function cachedDocuments(kind: DocumentKind) {
  "use cache: remote";
  cached(TAG.documents, TAG.customers);
  return db
    .select({ document: documents, company: customers.company })
    .from(documents)
    .innerJoin(customers, eq(customers.id, documents.customerId))
    .where(eq(documents.kind, kind))
    .orderBy(desc(documents.issueDate), desc(documents.number));
}

export async function listCustomerDocuments(customerId: string) {
  await requireSession();
  const today = await getToday();
  return (await cachedCustomerDocuments(customerId)).map((document) => ({
    document,
    status: displayStatus(document, today),
  }));
}

async function cachedCustomerDocuments(customerId: string) {
  "use cache: remote";
  cached(TAG.documents);
  return db
    .select()
    .from(documents)
    .where(eq(documents.customerId, customerId))
    .orderBy(desc(documents.issueDate), desc(documents.number));
}

export async function getDocument(id: string) {
  await requireSession();
  const row = await cachedDocument(id);
  if (!row) return null;
  return {
    ...row,
    status: displayStatus(row.document, await getToday()) as DisplayStatus,
  };
}

async function cachedDocument(id: string) {
  "use cache: remote";
  cached(TAG.documents, TAG.customers);
  const [row] = await db
    .select({ document: documents, customer: customers })
    .from(documents)
    .innerJoin(customers, eq(customers.id, documents.customerId))
    .where(eq(documents.id, id));
  if (!row) return null;
  const [lines, sendLog, paymentLog] = await Promise.all([
    db
      .select()
      .from(lineItems)
      .where(eq(lineItems.documentId, id))
      .orderBy(asc(lineItems.position)),
    db
      .select()
      .from(sends)
      .where(eq(sends.documentId, id))
      .orderBy(desc(sends.sentAt)),
    db
      .select()
      .from(payments)
      .where(eq(payments.documentId, id))
      .orderBy(asc(payments.paidAt), asc(payments.createdAt)),
  ]);
  return { ...row, lines, sends: sendLog, payments: paymentLog };
}

export type FullDocument = NonNullable<Awaited<ReturnType<typeof getDocument>>>;

/** Uncached: only the "PDF as sent" route reads it, once per click. */
export async function getSend(id: string) {
  await requireSession();
  const [row] = await db.select().from(sends).where(eq(sends.id, id));
  return row ?? null;
}

/** Defaults for a new document's form, from Settings and (when chosen) the customer. */
export async function documentDefaults(
  kind: DocumentKind,
  customerId?: string,
) {
  const [settings, customer] = await Promise.all([
    getSettings(),
    customerId ? getCustomer(customerId) : null,
  ]);
  const today = await getToday();
  return {
    currency: customer?.currency ?? settings.defaultCurrency,
    issueDate: today,
    validUntil:
      kind === "quote" ? addDays(today, settings.quoteValidityDays) : "",
    dueDate:
      kind === "invoice"
        ? addDays(today, customer?.termsDays ?? settings.defaultTermsDays)
        : "",
    taxRateBp: settings.defaultTaxRateBp,
    terms:
      (kind === "quote" ? settings.quoteTerms : settings.invoiceTerms) ?? "",
    notes: settings.defaultNotes ?? "",
  };
}

export async function listRecurring() {
  await requireSession();
  return (await cachedRecurringList()).map((row) => ({
    ...row,
    status: recurringStatus(row.schedule),
  }));
}

async function cachedRecurringList() {
  "use cache: remote";
  cached(TAG.recurring, TAG.customers);
  return db
    .select({ schedule: recurringInvoices, company: customers.company })
    .from(recurringInvoices)
    .innerJoin(customers, eq(customers.id, recurringInvoices.customerId))
    .orderBy(asc(recurringInvoices.nextIssueDate), asc(customers.company));
}

export async function getRecurring(id: string) {
  await requireSession();
  const row = await cachedRecurring(id);
  if (!row) return null;
  const today = await getToday();
  return {
    ...row,
    invoices: row.invoices.map((document) => ({
      document,
      status: displayStatus(document, today),
    })),
    status: recurringStatus(row.schedule),
  };
}

async function cachedRecurring(id: string) {
  "use cache: remote";
  cached(TAG.recurring, TAG.customers, TAG.documents);
  const [row] = await db
    .select({ schedule: recurringInvoices, customer: customers })
    .from(recurringInvoices)
    .innerJoin(customers, eq(customers.id, recurringInvoices.customerId))
    .where(eq(recurringInvoices.id, id));
  if (!row) return null;
  const [lines, invoices] = await Promise.all([
    db
      .select()
      .from(recurringLines)
      .where(eq(recurringLines.recurringId, id))
      .orderBy(asc(recurringLines.position)),
    db
      .select()
      .from(documents)
      .where(eq(documents.recurringId, id))
      .orderBy(desc(documents.issueDate), desc(documents.number)),
  ]);
  return { ...row, lines, invoices };
}
