"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, type Tx } from "@/db";
import { counters, documents, lineItems } from "@/db/schema";
import {
  addDays,
  allowedActions,
  DOCUMENT_KINDS,
  type DocumentKind,
  formatDocumentNumber,
  todayISO,
} from "@/lib/documents";
import { CURRENCIES, parseMoney } from "@/lib/money";
import { getDocument, getSettings } from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { computeTotals, parseQuantity, parseTaxRate } from "@/lib/totals";
import { type FormState, fieldErrorsFrom } from "./form-state";

const isoDate = z.iso.date("Pick a date.");
const optionalDate = z
  .string()
  .transform((value) => value || null)
  .pipe(isoDate.nullable());
const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null);

function parsed<T>(parse: (value: string) => T | null, message: string) {
  return z.string().transform((value, ctx) => {
    const result = parse(value.trim() === "" ? "0" : value);
    if (result === null) {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return result;
  });
}

const lineSchema = z.object({
  description: z.string().trim().min(1, "Describe this line."),
  quantity: parsed(parseQuantity, "A number, up to two decimals."),
  unitPrice: parsed(parseMoney, "An amount, e.g. 1500 or 1500.50."),
});

const documentSchema = z
  .object({
    id: z.uuid().optional(),
    kind: z.enum(DOCUMENT_KINDS),
    customerId: z.uuid("Choose a customer."),
    currency: z.enum(CURRENCIES),
    issueDate: isoDate,
    validUntil: optionalDate,
    dueDate: optionalDate,
    title: optionalText,
    notes: optionalText,
    terms: optionalText,
    discount: parsed(parseMoney, "An amount, e.g. 500."),
    taxRate: parsed(parseTaxRate, "A percentage from 0 to 100."),
    lines: z.array(lineSchema).min(1, "Add at least one line item."),
  })
  .superRefine((doc, ctx) => {
    if (doc.validUntil && doc.validUntil < doc.issueDate) {
      ctx.addIssue({
        code: "custom",
        path: ["validUntil"],
        message: "Must be on or after the issue date.",
      });
    }
    if (doc.dueDate && doc.dueDate < doc.issueDate) {
      ctx.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Must be on or after the issue date.",
      });
    }
    if (doc.kind === "invoice" && !doc.dueDate) {
      ctx.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Pick a due date.",
      });
    }
  });

export type DocumentInput = z.input<typeof documentSchema>;

/**
 * Next number for (kind, year), allocated inside the caller's transaction:
 * the upsert takes a row lock, so concurrent creates queue rather than
 * collide, and a rolled-back create releases its number.
 */
async function allocateNumber(tx: Tx, kind: DocumentKind, issueDate: string) {
  const year = Number(issueDate.slice(0, 4));
  const [row] = await tx
    .insert(counters)
    .values({ kind, year, lastValue: 1 })
    .onConflictDoUpdate({
      target: [counters.kind, counters.year],
      set: { lastValue: sql`${counters.lastValue} + 1` },
    })
    .returning({ value: counters.lastValue });
  return formatDocumentNumber(kind, year, row.value);
}

function pathFor(kind: DocumentKind, id?: string) {
  const base = kind === "quote" ? "/quotes" : "/invoices";
  return id ? `${base}/${id}` : base;
}

function revalidateDocument(
  kind: DocumentKind,
  id: string,
  customerId?: string,
) {
  revalidatePath(pathFor(kind));
  revalidatePath(pathFor(kind, id));
  revalidatePath("/");
  if (customerId) revalidatePath(`/customers/${customerId}`);
}

export async function saveDocument(input: DocumentInput): Promise<FormState> {
  await requireSession();
  const result = documentSchema.safeParse(input);
  if (!result.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: fieldErrorsFrom(result.error.issues),
    };
  }
  const doc = result.data;
  const lines = doc.lines.map((line) => ({
    quantityHundredths: line.quantity,
    unitPriceMinor: line.unitPrice,
  }));
  const totals = computeTotals(lines, doc.discount, doc.taxRate);
  const values = {
    customerId: doc.customerId,
    currency: doc.currency,
    issueDate: doc.issueDate,
    validUntil: doc.kind === "quote" ? doc.validUntil : null,
    dueDate: doc.kind === "invoice" ? doc.dueDate : null,
    title: doc.title,
    notes: doc.notes,
    terms: doc.terms,
    discountMinor: doc.discount,
    taxRateBp: doc.taxRate,
    subtotalMinor: totals.subtotalMinor,
    taxMinor: totals.taxMinor,
    totalMinor: totals.totalMinor,
  };

  let id = doc.id;
  try {
    id = await db.transaction(async (tx) => {
      let documentId: string;
      if (doc.id) {
        const [existing] = await tx
          .select()
          .from(documents)
          .where(and(eq(documents.id, doc.id), eq(documents.kind, doc.kind)))
          .for("update");
        if (!existing) throw new Error("Document not found.");
        if (!allowedActions(existing.kind, existing.status).edit) {
          throw new Error(
            `A ${existing.status} ${existing.kind} can't be edited.`,
          );
        }
        await tx
          .update(documents)
          .set({
            ...values,
            editedAt: new Date(),
            // A revised quote goes back to draft and has to be re-sent; a
            // sent invoice stays sent (and keeps counting as outstanding).
            status:
              existing.kind === "quote" && existing.status === "sent"
                ? "draft"
                : existing.status,
          })
          .where(eq(documents.id, doc.id));
        await tx.delete(lineItems).where(eq(lineItems.documentId, doc.id));
        documentId = doc.id;
      } else {
        const number = await allocateNumber(tx, doc.kind, doc.issueDate);
        const [created] = await tx
          .insert(documents)
          .values({ ...values, kind: doc.kind, number })
          .returning({ id: documents.id });
        documentId = created.id;
      }
      await tx.insert(lineItems).values(
        doc.lines.map((line, position) => ({
          documentId,
          position,
          description: line.description,
          quantityHundredths: line.quantity,
          unitPriceMinor: line.unitPrice,
          amountMinor: totals.lineAmounts[position],
        })),
      );
      return documentId;
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Couldn't save." };
  }

  revalidateDocument(doc.kind, id as string, doc.customerId);
  redirect(pathFor(doc.kind, id));
}

type Transition = "accept" | "decline" | "void" | "reopen";

// The detail page's buttons. These return `{ error }` rather than throw:
// thrown messages are redacted in production builds.
type ActionResult = { error?: string };

/** Manual status changes from the detail page. Each is checked against allowedActions. */
export async function transitionDocument(
  id: string,
  transition: Transition,
): Promise<ActionResult> {
  await requireSession();
  const [doc] = await db.select().from(documents).where(eq(documents.id, id));
  if (!doc) return { error: "Document not found." };
  const allowed = allowedActions(doc.kind, doc.status);
  const now = new Date();

  if (transition === "accept" && allowed.accept) {
    await db
      .update(documents)
      .set({ status: "accepted", acceptedAt: now })
      .where(eq(documents.id, id));
  } else if (transition === "decline" && allowed.decline) {
    await db
      .update(documents)
      .set({ status: "declined", declinedAt: now })
      .where(eq(documents.id, id));
  } else if (transition === "void" && allowed.void) {
    await db
      .update(documents)
      .set({ status: "void", voidedAt: now })
      .where(eq(documents.id, id));
  } else if (
    transition === "reopen" &&
    (doc.status === "accepted" ||
      doc.status === "declined" ||
      doc.status === "paid")
  ) {
    // Undo a manual mark: back to sent (or draft if it was never emailed).
    await db
      .update(documents)
      .set({
        status: doc.sentAt ? "sent" : "draft",
        acceptedAt: null,
        declinedAt: null,
        paidAt: null,
        paymentRef: null,
      })
      .where(eq(documents.id, id));
  } else {
    return { error: `Can't ${transition} a ${doc.status} ${doc.kind}.` };
  }
  revalidateDocument(doc.kind, id, doc.customerId);
  return {};
}

const paymentSchema = z.object({
  paidAt: isoDate,
  paymentRef: optionalText,
});

export async function markPaid(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();
  const parsedPayment = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsedPayment.success) {
    return { fieldErrors: fieldErrorsFrom(parsedPayment.error.issues) };
  }
  const [doc] = await db.select().from(documents).where(eq(documents.id, id));
  if (!doc || !allowedActions(doc.kind, doc.status).markPaid) {
    return { error: "Only a sent invoice can be marked paid." };
  }
  await db
    .update(documents)
    .set({ status: "paid", ...parsedPayment.data })
    .where(eq(documents.id, id));
  revalidateDocument(doc.kind, id, doc.customerId);
  return { ok: true };
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  await requireSession();
  const [doc] = await db.select().from(documents).where(eq(documents.id, id));
  if (!doc || !allowedActions(doc.kind, doc.status).delete) {
    return {
      error: "Only a draft quote can be deleted; void an invoice instead.",
    };
  }
  await db.delete(documents).where(eq(documents.id, id));
  revalidateDocument(doc.kind, id, doc.customerId);
  redirect(pathFor(doc.kind));
}

/** Copies a document into a new draft: an accepted quote into an invoice, or any document into another of its kind. */
async function copyInto(sourceId: string, kind: DocumentKind) {
  const source = await getDocument(sourceId);
  if (!source) throw new Error("Document not found.");
  const settings = await getSettings();
  const today = todayISO();

  const id = await db.transaction(async (tx) => {
    const number = await allocateNumber(tx, kind, today);
    const [created] = await tx
      .insert(documents)
      .values({
        kind,
        number,
        customerId: source.document.customerId,
        currency: source.document.currency,
        issueDate: today,
        validUntil:
          kind === "quote" ? addDays(today, settings.quoteValidityDays) : null,
        dueDate:
          kind === "invoice" ? addDays(today, source.customer.termsDays) : null,
        title: source.document.title,
        notes: source.document.notes,
        terms:
          kind === source.document.kind
            ? source.document.terms
            : kind === "invoice"
              ? settings.invoiceTerms
              : settings.quoteTerms,
        discountMinor: source.document.discountMinor,
        taxRateBp: source.document.taxRateBp,
        subtotalMinor: source.document.subtotalMinor,
        taxMinor: source.document.taxMinor,
        totalMinor: source.document.totalMinor,
        sourceQuoteId:
          source.document.kind === "quote" && kind === "invoice"
            ? sourceId
            : null,
      })
      .returning({ id: documents.id });
    if (source.lines.length) {
      await tx.insert(lineItems).values(
        source.lines.map(({ id: _id, documentId: _doc, ...line }) => ({
          ...line,
          documentId: created.id,
        })),
      );
    }
    return created.id;
  });
  revalidateDocument(kind, id, source.document.customerId);
  return id;
}

export async function convertToInvoice(quoteId: string): Promise<ActionResult> {
  await requireSession();
  const [quote] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, quoteId));
  if (!quote || !allowedActions(quote.kind, quote.status).convert) {
    return { error: "Only an accepted quote can be converted." };
  }
  const id = await copyInto(quoteId, "invoice");
  redirect(`/invoices/${id}/edit`);
}

export async function duplicateDocument(id: string): Promise<ActionResult> {
  await requireSession();
  const [doc] = await db.select().from(documents).where(eq(documents.id, id));
  if (!doc) return { error: "Document not found." };
  const copyId = await copyInto(id, doc.kind);
  redirect(`${pathFor(doc.kind, copyId)}/edit`);
}
