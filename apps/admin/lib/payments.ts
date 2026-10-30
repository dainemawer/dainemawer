import "server-only";
import { desc, eq, sum } from "drizzle-orm";
import type { db } from "@/db";
import { documents, payments } from "@/db/schema";

// Not in lib/actions/payments.ts: everything a "use server" file exports
// becomes a public Server Action, and this takes a transaction.

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Brings an invoice in line with its payments: the sum, and "paid" (with
 * the settling payment's date and reference) once it covers the total. A
 * draft that takes money has clearly gone out, so it becomes sent; a paid
 * invoice that loses a payment goes back to sent.
 */
export async function settle(tx: Tx, documentId: string) {
  const [doc] = await tx
    .select()
    .from(documents)
    .where(eq(documents.id, documentId));
  const [{ paid }] = await tx
    .select({ paid: sum(payments.amountMinor).mapWith(Number) })
    .from(payments)
    .where(eq(payments.documentId, documentId));
  const paidMinor = paid ?? 0;
  const [last] = await tx
    .select()
    .from(payments)
    .where(eq(payments.documentId, documentId))
    .orderBy(desc(payments.paidAt), desc(payments.createdAt))
    .limit(1);
  const inFull = paidMinor > 0 && paidMinor >= doc.totalMinor;
  const status = inFull
    ? "paid"
    : doc.status === "paid" || (doc.status === "draft" && paidMinor > 0)
      ? "sent"
      : doc.status;
  await tx
    .update(documents)
    .set({
      paidMinor,
      status,
      sentAt: status === "sent" ? (doc.sentAt ?? new Date()) : doc.sentAt,
      paidAt: inFull ? last.paidAt : null,
      paymentRef: inFull ? last.reference : null,
    })
    .where(eq(documents.id, documentId));
}
