"use server";

import { and, eq, ne } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { documents, lineItems } from "@/db/schema";
import { TAG } from "@/lib/cache-tags";
import {
  addDays,
  allowedActions,
  DOCUMENT_KINDS,
  type DocumentKind,
  type StoredStatus,
  statusTargets,
  todayISO,
} from "@/lib/documents";
import { errorMessage, UserError } from "@/lib/errors";
import { CURRENCIES } from "@/lib/money";
import { allocateNumber } from "@/lib/numbering";
import { getDocument, getSettings } from "@/lib/queries";
import { requireSession } from "@/lib/session";
import {
  checkPricing,
  isoDate,
  optionalDate,
  optionalText,
  pricingShape,
  totalsOf,
} from "@/lib/validation";
import { type FormState, fieldErrorsFrom } from "./form-state";

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
    ...pricingShape,
  })
  .superRefine((doc, ctx) => {
    checkPricing(doc, ctx);
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

function pathFor(kind: DocumentKind, id?: string) {
  const base = kind === "quote" ? "/quotes" : "/invoices";
  return id ? `${base}/${id}` : base;
}

/** Every page that lists or totals documents reads the one tag. */
function revalidateDocuments() {
  updateTag(TAG.documents);
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
  const totals = totalsOf(doc);
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
        if (!existing) throw new UserError("Document not found.");
        if (!allowedActions(existing.kind, existing.status).edit) {
          throw new UserError(
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
    return { error: errorMessage(error, "Couldn't save.") };
  }

  revalidateDocuments();
  redirect(pathFor(doc.kind, id));
}

// The detail page's buttons. These return `{ error }` rather than throw:
// thrown messages are redacted in production builds.
type ActionResult = { error?: string };

/**
 * Sets a status by hand (the detail page's Change status menu and its
 * Mark accepted shortcut). Each status keeps only its own timestamp, so
 * moving back clears the later ones; sentAt stays unless it goes back to
 * draft. Paid goes through markPaid, which records the date.
 */
export async function setStatus(
  id: string,
  target: StoredStatus,
): Promise<ActionResult> {
  await requireSession();
  const [doc] = await db.select().from(documents).where(eq(documents.id, id));
  if (!doc) return { error: "Document not found." };
  if (!statusTargets(doc.kind, doc.status).includes(target)) {
    return { error: `A ${doc.status} ${doc.kind} can't be marked ${target}.` };
  }
  if (target === "paid") {
    return { error: "Use Mark paid, so the payment date is recorded." };
  }
  const now = new Date();
  const cleared = {
    acceptedAt: null,
    declinedAt: null,
    paidAt: null,
    paymentRef: null,
    voidedAt: null,
  };
  const stamps = {
    draft: { sentAt: null },
    sent: { sentAt: doc.sentAt ?? now },
    accepted: { acceptedAt: now },
    declined: { declinedAt: now },
    void: { voidedAt: now },
  }[target];
  try {
    await db
      .update(documents)
      .set({ status: target, ...cleared, ...stamps })
      .where(eq(documents.id, id));
  } catch (error) {
    // Restoring a voided invoice whose quote has since been invoiced again.
    if (isUniqueViolation(error)) {
      return {
        error: "Its quote already has another invoice. Void that one first.",
      };
    }
    return { error: errorMessage(error, "Couldn't change the status.") };
  }
  revalidateDocuments();
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
    return { error: "Only an unpaid invoice can be marked paid." };
  }
  await db
    .update(documents)
    .set({ status: "paid", ...parsedPayment.data })
    .where(eq(documents.id, id));
  revalidateDocuments();
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
  revalidateDocuments();
  redirect(pathFor(doc.kind));
}

/** Copies a document into a new draft: a quote into an invoice (accepting it), or any document into another of its kind. */
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
    // An invoice means the quote was accepted, whether or not it was marked.
    if (
      source.document.kind === "quote" &&
      kind === "invoice" &&
      source.document.status !== "accepted"
    ) {
      await tx
        .update(documents)
        .set({ status: "accepted", acceptedAt: new Date(), declinedAt: null })
        .where(eq(documents.id, sourceId));
    }
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
  revalidateDocuments();
  return id;
}

export async function convertToInvoice(quoteId: string): Promise<ActionResult> {
  await requireSession();
  const [quote] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, quoteId));
  if (!quote || !allowedActions(quote.kind, quote.status).convert) {
    return {
      error: "A declined quote can't be converted; change its status first.",
    };
  }
  const existing = await liveInvoiceFor(quoteId);
  if (existing) redirect(`/invoices/${existing}`);

  let id: string;
  try {
    id = await copyInto(quoteId, "invoice");
  } catch (error) {
    // Lost a race with a concurrent convert: the unique index on
    // source_quote_id refused the second invoice, so show the first.
    const winner = isUniqueViolation(error) && (await liveInvoiceFor(quoteId));
    if (winner) redirect(`/invoices/${winner}`);
    throw error;
  }
  redirect(`/invoices/${id}/edit`);
}

async function liveInvoiceFor(quoteId: string) {
  const [row] = await db
    .select({ id: documents.id })
    .from(documents)
    .where(
      and(
        eq(documents.sourceQuoteId, quoteId),
        eq(documents.kind, "invoice"),
        ne(documents.status, "void"),
      ),
    );
  return row?.id ?? null;
}

function isUniqueViolation(error: unknown): boolean {
  // Drizzle wraps the driver error; Postgres reports 23505 either way.
  const codeOf = (e: unknown) =>
    typeof e === "object" && e !== null && "code" in e ? e.code : undefined;
  return (
    codeOf(error) === "23505" ||
    codeOf((error as { cause?: unknown } | null)?.cause) === "23505"
  );
}

export async function duplicateDocument(id: string): Promise<ActionResult> {
  await requireSession();
  const [doc] = await db.select().from(documents).where(eq(documents.id, id));
  if (!doc) return { error: "Document not found." };
  const copyId = await copyInto(id, doc.kind);
  redirect(`${pathFor(doc.kind, copyId)}/edit`);
}
