import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { DocumentKind, StoredStatus } from "@/lib/documents";
import type { CategoryKind, LabelSource } from "@/lib/expenses/transactions";
import type { Currency } from "@/lib/money";
import type { Interval } from "@/lib/recurring-dates";

// Column names are snake_case in Postgres and camelCase here — the client
// and drizzle.config.ts both set `casing: "snake_case"`, so no column below
// spells its SQL name out.

const money = () => bigint({ mode: "number" });

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/* ---------- Better Auth (field names must match what it expects) ---------- */

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  ...timestamps,
});

export const session = pgTable("session", {
  id: text().primaryKey(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  token: text().notNull().unique(),
  ipAddress: text(),
  userAgent: text(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  ...timestamps,
});

export const account = pgTable("account", {
  id: text().primaryKey(),
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp({ withTimezone: true }),
  refreshTokenExpiresAt: timestamp({ withTimezone: true }),
  scope: text(),
  password: text(),
  ...timestamps,
});

export const verification = pgTable("verification", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  ...timestamps,
});

export const rateLimit = pgTable("rate_limit", {
  id: text().primaryKey(),
  key: text().notNull().unique(),
  count: integer().notNull(),
  lastRequest: bigint({ mode: "number" }).notNull(),
});

/* ---------- Invoicing ---------- */

export const customers = pgTable("customers", {
  id: uuid().primaryKey().defaultRandom(),
  company: text().notNull(),
  contactName: text(),
  /** Billing addresses; the first is the default "to" when sending. */
  emails: text().array().notNull().default(sql`'{}'::text[]`),
  ccEmail: text(),
  address: text(),
  taxNumber: text(),
  currency: text().$type<Currency>().notNull().default("ZAR"),
  termsDays: integer().notNull().default(30),
  notes: text(),
  archivedAt: timestamp({ withTimezone: true }),
  ...timestamps,
});

export const documents = pgTable(
  "documents",
  {
    id: uuid().primaryKey().defaultRandom(),
    kind: text().$type<DocumentKind>().notNull(),
    number: text().notNull(),
    customerId: uuid()
      .notNull()
      .references(() => customers.id),
    status: text().$type<StoredStatus>().notNull().default("draft"),
    currency: text().$type<Currency>().notNull(),
    issueDate: date({ mode: "string" }).notNull(),
    validUntil: date({ mode: "string" }),
    dueDate: date({ mode: "string" }),
    title: text(),
    notes: text(),
    terms: text(),
    discountMinor: money().notNull().default(0),
    taxRateBp: integer().notNull().default(0),
    // Denormalised from line_items on every save (lib/totals.ts), so lists
    // and the dashboard aggregate without joining lines.
    subtotalMinor: money().notNull().default(0),
    taxMinor: money().notNull().default(0),
    totalMinor: money().notNull().default(0),
    sourceQuoteId: uuid(),
    /** The schedule that created this invoice, and the issue date it was for. */
    recurringId: uuid().references(() => recurringInvoices.id, {
      onDelete: "set null",
    }),
    recurringDate: date({ mode: "string" }),
    sentAt: timestamp({ withTimezone: true }),
    acceptedAt: timestamp({ withTimezone: true }),
    declinedAt: timestamp({ withTimezone: true }),
    paidAt: date({ mode: "string" }),
    paymentRef: text(),
    voidedAt: timestamp({ withTimezone: true }),
    /** Last change to what the PDF shows; status changes don't touch it. */
    editedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("documents_kind_number_idx").on(t.kind, t.number),
    index("documents_customer_idx").on(t.customerId),
    index("documents_kind_status_idx").on(t.kind, t.status),
    // One live invoice per quote: a double-clicked Convert can't create two.
    // A voided invoice frees the quote to be converted again.
    uniqueIndex("documents_source_quote_idx")
      .on(t.sourceQuoteId)
      .where(sql`${t.kind} = 'invoice' and ${t.status} <> 'void'`),
    // One invoice per schedule per issue date: a cron run that repeats or
    // overlaps can't bill a client twice.
    uniqueIndex("documents_recurring_date_idx")
      .on(t.recurringId, t.recurringDate)
      .where(sql`${t.recurringId} is not null`),
  ],
);

export const lineItems = pgTable(
  "line_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    documentId: uuid()
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    position: integer().notNull(),
    description: text().notNull(),
    /** 1.5 hours = 150; see lib/totals.ts. */
    quantityHundredths: integer().notNull(),
    unitPriceMinor: money().notNull(),
    amountMinor: money().notNull(),
  },
  (t) => [index("line_items_document_idx").on(t.documentId, t.position)],
);

/**
 * A template the daily cron (app/api/cron/recurring) turns into a draft
 * invoice on each issue date; see lib/recurring.ts.
 */
export const recurringInvoices = pgTable(
  "recurring_invoices",
  {
    id: uuid().primaryKey().defaultRandom(),
    customerId: uuid()
      .notNull()
      .references(() => customers.id),
    currency: text().$type<Currency>().notNull(),
    interval: text().$type<Interval>().notNull(),
    /** Day of the month every issue date aims for (see lib/recurring-dates.ts). */
    anchorDay: integer().notNull(),
    nextIssueDate: date({ mode: "string" }).notNull(),
    /** No invoices are issued after this date. */
    endDate: date({ mode: "string" }),
    pausedAt: timestamp({ withTimezone: true }),
    title: text(),
    notes: text(),
    terms: text(),
    discountMinor: money().notNull().default(0),
    taxRateBp: integer().notNull().default(0),
    totalMinor: money().notNull().default(0),
    ...timestamps,
  },
  (t) => [index("recurring_invoices_next_idx").on(t.nextIssueDate)],
);

export const recurringLines = pgTable(
  "recurring_lines",
  {
    id: uuid().primaryKey().defaultRandom(),
    recurringId: uuid()
      .notNull()
      .references(() => recurringInvoices.id, { onDelete: "cascade" }),
    position: integer().notNull(),
    description: text().notNull(),
    quantityHundredths: integer().notNull(),
    unitPriceMinor: money().notNull(),
  },
  (t) => [index("recurring_lines_recurring_idx").on(t.recurringId, t.position)],
);

/** One row per email sent: the audit trail of exactly what a client received. */
export const sends = pgTable(
  "sends",
  {
    id: uuid().primaryKey().defaultRandom(),
    documentId: uuid()
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    to: text().array().notNull(),
    cc: text().array().notNull().default(sql`'{}'::text[]`),
    subject: text().notNull(),
    body: text().notNull(),
    /** Private Blob pathname of the PDF snapshot, or null where Blob isn't configured. */
    pdfPathname: text(),
    resendId: text(),
    status: text().notNull().default("sent"),
    sentAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sends_document_idx").on(t.documentId)],
);

/** Gapless per-year numbering: an atomic upsert-and-increment inside the create transaction. */
export const counters = pgTable(
  "counters",
  {
    kind: text().$type<DocumentKind>().notNull(),
    year: integer().notNull(),
    lastValue: integer().notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.kind, t.year] })],
);

/** A single row (id = 1): business details, bank details, defaults and email templates. */
export const settings = pgTable("settings", {
  id: integer().primaryKey().default(1),
  businessName: text().notNull().default("Daine Mawer"),
  address: text(),
  email: text(),
  phone: text(),
  website: text(),
  taxNumber: text(),
  bankDetails: text(),
  defaultCurrency: text().$type<Currency>().notNull().default("ZAR"),
  defaultTermsDays: integer().notNull().default(30),
  defaultTaxRateBp: integer().notNull().default(0),
  quoteValidityDays: integer().notNull().default(30),
  quoteTerms: text(),
  invoiceTerms: text(),
  defaultNotes: text(),
  quoteEmailSubject: text().notNull().default("Quote {number} from {business}"),
  quoteEmailBody: text()
    .notNull()
    .default(
      "Hi {contact},\n\nPlease find quote {number} for {total} attached. It's valid until {validUntil}.\n\nReply to this email with any questions, or to accept.\n\nThanks,\n{business}",
    ),
  invoiceEmailSubject: text()
    .notNull()
    .default("Invoice {number} from {business}"),
  invoiceEmailBody: text()
    .notNull()
    .default(
      "Hi {contact},\n\nPlease find invoice {number} for {total} attached, due on {dueDate}. Bank details are on the invoice.\n\nThanks,\n{business}",
    ),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/* ---------- Expenses (personal Investec accounts) ---------- */
// Transactions themselves are never stored: they're fetched from Investec
// on demand. What's kept is only what the app adds: a category per
// transaction ID, the rules and notes the classifier learns from, and
// monthly totals so trends outlive Investec's history window.

/** Investec accounts the app has seen; only `included` ones are analysed. */
export const expenseAccounts = pgTable("expense_accounts", {
  accountId: text().primaryKey(),
  name: text().notNull(),
  productName: text().notNull(),
  included: boolean().notNull().default(false),
  ...timestamps,
});

export const expenseCategories = pgTable("expense_categories", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull().unique(),
  /** Spending and income count towards totals; transfers between your own accounts don't. */
  kind: text().$type<CategoryKind>().notNull(),
  /** What belongs here, in words: the classifier reads it. */
  description: text(),
  position: integer().notNull().default(0),
  ...timestamps,
});

/** One per Investec transaction (its `uuid`): the category and nothing else about it. */
export const expenseLabels = pgTable(
  "expense_labels",
  {
    transactionId: text().primaryKey(),
    accountId: text().notNull(),
    categoryId: uuid()
      .notNull()
      .references(() => expenseCategories.id),
    deductible: boolean().notNull().default(false),
    source: text().$type<LabelSource>().notNull(),
    /** The classifier's confidence (0–1); null for rules and your own labels. */
    confidence: real(),
    /** Set when the classifier wasn't sure; cleared once you confirm or correct it. */
    needsReview: boolean().notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index("expense_labels_review_idx")
      .on(t.needsReview)
      .where(sql`${t.needsReview}`),
  ],
);

/** "Descriptions containing PATTERN are CATEGORY": learned from your corrections. */
export const expenseRules = pgTable("expense_rules", {
  id: uuid().primaryKey().defaultRandom(),
  /** Matched against the normalised merchant (lib/expenses/transactions.ts). */
  pattern: text().notNull().unique(),
  categoryId: uuid()
    .notNull()
    .references(() => expenseCategories.id, { onDelete: "cascade" }),
  deductible: boolean().notNull().default(false),
  ...timestamps,
});

/** Free-text context the classifier reads on every run. */
export const expenseNotes = pgTable("expense_notes", {
  id: uuid().primaryKey().defaultRandom(),
  body: text().notNull(),
  ...timestamps,
});

/** Totals per category per month (month = its first day), recomputed from Investec. */
export const expenseMonthly = pgTable(
  "expense_monthly",
  {
    month: date({ mode: "string" }).notNull(),
    categoryId: uuid()
      .notNull()
      .references(() => expenseCategories.id, { onDelete: "cascade" }),
    /** Debits and credits kept apart: a refund is money in on a spending category. */
    outMinor: money().notNull().default(0),
    inMinor: money().notNull().default(0),
    deductibleOutMinor: money().notNull().default(0),
    count: integer().notNull().default(0),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.month, t.categoryId] })],
);

export type Customer = typeof customers.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type LineItem = typeof lineItems.$inferSelect;
export type Send = typeof sends.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type RecurringInvoice = typeof recurringInvoices.$inferSelect;
export type RecurringLine = typeof recurringLines.$inferSelect;
export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type ExpenseLabel = typeof expenseLabels.$inferSelect;
export type ExpenseRule = typeof expenseRules.$inferSelect;
