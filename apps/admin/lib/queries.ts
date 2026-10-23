import "server-only";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, documents, lineItems, sends, settings } from "@/db/schema";
import {
  addDays,
  type DisplayStatus,
  type DocumentKind,
  displayStatus,
  todayISO,
} from "@/lib/documents";

// Reads only. Every caller is a Server Component or Server Action that has
// already passed requireSession().

export async function getSettings() {
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
  const totals = db
    .select({
      customerId: documents.customerId,
      outstanding:
        sql<number>`coalesce(sum(${documents.totalMinor}) filter (where ${documents.kind} = 'invoice' and ${documents.status} = 'sent'), 0)`
          .mapWith(Number)
          .as("outstanding"),
      paid: sql<number>`coalesce(sum(${documents.totalMinor}) filter (where ${documents.kind} = 'invoice' and ${documents.status} = 'paid'), 0)`
        .mapWith(Number)
        .as("paid"),
      count: sql<number>`count(*)`.mapWith(Number).as("count"),
    })
    .from(documents)
    .groupBy(documents.customerId)
    .as("totals");

  return db
    .select({
      customer: customers,
      outstanding: sql<number>`coalesce(${totals.outstanding}, 0)`.mapWith(
        Number,
      ),
      paid: sql<number>`coalesce(${totals.paid}, 0)`.mapWith(Number),
      documentCount: sql<number>`coalesce(${totals.count}, 0)`.mapWith(Number),
    })
    .from(customers)
    .leftJoin(totals, eq(totals.customerId, customers.id))
    .where(
      archived
        ? sql`${customers.archivedAt} is not null`
        : isNull(customers.archivedAt),
    )
    .orderBy(asc(customers.company));
}

export async function getCustomer(id: string) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id));
  return customer ?? null;
}

export type DocumentRow = Awaited<ReturnType<typeof listDocuments>>[number];

export async function listDocuments(
  kind: DocumentKind,
  options: { customerId?: string } = {},
) {
  const today = todayISO();
  const rows = await db
    .select({
      document: documents,
      company: customers.company,
    })
    .from(documents)
    .innerJoin(customers, eq(customers.id, documents.customerId))
    .where(
      and(
        eq(documents.kind, kind),
        options.customerId
          ? eq(documents.customerId, options.customerId)
          : undefined,
      ),
    )
    .orderBy(desc(documents.issueDate), desc(documents.number));
  return rows.map((row) => ({
    ...row,
    status: displayStatus(row.document, today),
  }));
}

export async function listCustomerDocuments(customerId: string) {
  const rows = await db
    .select()
    .from(documents)
    .where(eq(documents.customerId, customerId))
    .orderBy(desc(documents.issueDate), desc(documents.number));
  const today = todayISO();
  return rows.map((document) => ({
    document,
    status: displayStatus(document, today),
  }));
}

export async function getDocument(id: string) {
  const [row] = await db
    .select({ document: documents, customer: customers })
    .from(documents)
    .innerJoin(customers, eq(customers.id, documents.customerId))
    .where(eq(documents.id, id));
  if (!row) return null;
  const [lines, sendLog] = await Promise.all([
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
  ]);
  return {
    ...row,
    lines,
    sends: sendLog,
    status: displayStatus(row.document, todayISO()) as DisplayStatus,
  };
}

export type FullDocument = NonNullable<Awaited<ReturnType<typeof getDocument>>>;

export async function getSend(id: string) {
  const [row] = await db.select().from(sends).where(eq(sends.id, id));
  return row ?? null;
}

/** Defaults for a new document's form, from Settings and (when chosen) the customer. */
export async function documentDefaults(
  kind: DocumentKind,
  customerId?: string,
) {
  const settings = await getSettings();
  const today = todayISO();
  const [customer] = customerId
    ? await db.select().from(customers).where(eq(customers.id, customerId))
    : [];
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
