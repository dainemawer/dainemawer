"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { documents, payments } from "@/db/schema";
import { audit } from "@/lib/audit";
import { TAG } from "@/lib/cache-tags";
import { allowedActions, todayISO } from "@/lib/documents";
import { errorMessage, UserError } from "@/lib/errors";
import { type Currency, formatMoney, parseMoney } from "@/lib/money";
import { settle } from "@/lib/payments";
import { requireSession } from "@/lib/session";
import { isoDate, optionalText } from "@/lib/validation";
import { type FormState, fieldErrorsFrom } from "./form-state";

// Money received against an invoice, in parts or all at once. The invoice
// keeps the sum (paidMinor) and turns "paid" when it covers the total;
// settle() in lib/payments.ts is the one place that decides.

const paymentSchema = z.object({
  amount: z.string().transform((value, ctx) => {
    const minor = parseMoney(value);
    if (minor === null || minor <= 0) {
      ctx.addIssue({ code: "custom", message: "An amount above zero." });
      return z.NEVER;
    }
    return minor;
  }),
  paidAt: isoDate,
  reference: optionalText,
});

export async function recordPayment(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  const { amount, paidAt, reference } = parsed.data;
  if (paidAt > todayISO()) {
    return { fieldErrors: { paidAt: ["Not a date in the future."] } };
  }
  let number = "";
  let currency: Currency = "ZAR";
  try {
    await db.transaction(async (tx) => {
      const [doc] = await tx
        .select()
        .from(documents)
        .where(eq(documents.id, id))
        .for("update");
      if (!doc || !allowedActions(doc.kind, doc.status).markPaid) {
        throw new UserError("Only an unpaid invoice can take a payment.");
      }
      const due = doc.totalMinor - doc.paidMinor;
      if (amount > due) {
        throw new UserError(
          `That's more than the ${formatMoney(due, doc.currency)} still due.`,
        );
      }
      await tx
        .insert(payments)
        .values({ documentId: id, amountMinor: amount, paidAt, reference });
      await settle(tx, id);
      number = doc.number;
      currency = doc.currency;
    });
  } catch (error) {
    return { error: errorMessage(error, "Couldn't record the payment.") };
  }
  await audit(
    "payment-recorded",
    `${number}: ${formatMoney(amount, currency)}`,
  );
  updateTag(TAG.documents);
  return { ok: true };
}

/** Takes a payment off again (a mistake, a bounced transfer). */
export async function removePayment(
  paymentId: string,
): Promise<{ error?: string }> {
  await requireSession();
  let detail = "";
  try {
    await db.transaction(async (tx) => {
      const [row] = await tx
        .select({ payment: payments, document: documents })
        .from(payments)
        .innerJoin(documents, eq(documents.id, payments.documentId))
        .where(eq(payments.id, paymentId))
        .for("update");
      if (!row) throw new UserError("That payment is already gone.");
      if (row.document.status === "void") {
        throw new UserError("A void invoice's payments can't change.");
      }
      await tx.delete(payments).where(eq(payments.id, paymentId));
      await settle(tx, row.document.id);
      detail = `${row.document.number}: ${formatMoney(row.payment.amountMinor, row.document.currency)}`;
    });
  } catch (error) {
    return { error: errorMessage(error, "Couldn't remove the payment.") };
  }
  await audit("payment-removed", detail);
  updateTag(TAG.documents);
  return {};
}
