"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { recurringInvoices, recurringLines } from "@/db/schema";
import { TAG } from "@/lib/cache-tags";
import { todayISO } from "@/lib/documents";
import { errorMessage, UserError } from "@/lib/errors";
import { CURRENCIES } from "@/lib/money";
import { INTERVALS, nextIssueDate } from "@/lib/recurring-dates";
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

const recurringSchema = z
  .object({
    id: z.uuid().optional(),
    customerId: z.uuid("Choose a customer."),
    currency: z.enum(CURRENCIES),
    interval: z.enum(INTERVALS),
    nextIssueDate: isoDate,
    endDate: optionalDate,
    title: optionalText,
    notes: optionalText,
    terms: optionalText,
    ...pricingShape,
  })
  .superRefine((schedule, ctx) => {
    checkPricing(schedule, ctx);
    // A past date would issue backdated invoices on the next run.
    if (schedule.nextIssueDate < todayISO()) {
      ctx.addIssue({
        code: "custom",
        path: ["nextIssueDate"],
        message: "Pick today or a later date.",
      });
    }
    if (schedule.endDate && schedule.endDate < schedule.nextIssueDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "Must be on or after the next issue date.",
      });
    }
  });

export type RecurringInput = z.input<typeof recurringSchema>;

type ActionResult = { error?: string };

function revalidateRecurring() {
  updateTag(TAG.recurring);
  // Deleting a schedule unlinks its invoices.
  updateTag(TAG.documents);
}

export async function saveRecurring(input: RecurringInput): Promise<FormState> {
  await requireSession();
  const result = recurringSchema.safeParse(input);
  if (!result.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: fieldErrorsFrom(result.error.issues),
    };
  }
  const schedule = result.data;
  const values = {
    customerId: schedule.customerId,
    currency: schedule.currency,
    interval: schedule.interval,
    // The day the user picked is the one every later issue date aims for.
    anchorDay: Number(schedule.nextIssueDate.slice(8, 10)),
    nextIssueDate: schedule.nextIssueDate,
    endDate: schedule.endDate,
    title: schedule.title,
    notes: schedule.notes,
    terms: schedule.terms,
    discountMinor: schedule.discount,
    taxRateBp: schedule.taxRate,
    totalMinor: totalsOf(schedule).totalMinor,
  };

  let id = schedule.id;
  try {
    id = await db.transaction(async (tx) => {
      let recurringId: string;
      if (schedule.id) {
        const [updated] = await tx
          .update(recurringInvoices)
          .set(values)
          .where(eq(recurringInvoices.id, schedule.id))
          .returning({ id: recurringInvoices.id });
        if (!updated) throw new UserError("Recurring invoice not found.");
        await tx
          .delete(recurringLines)
          .where(eq(recurringLines.recurringId, schedule.id));
        recurringId = updated.id;
      } else {
        const [created] = await tx
          .insert(recurringInvoices)
          .values(values)
          .returning({ id: recurringInvoices.id });
        recurringId = created.id;
      }
      await tx.insert(recurringLines).values(
        schedule.lines.map((line, position) => ({
          recurringId,
          position,
          description: line.description,
          quantityHundredths: line.quantity,
          unitPriceMinor: line.unitPrice,
        })),
      );
      return recurringId;
    });
  } catch (error) {
    return { error: errorMessage(error, "Couldn't save.") };
  }

  revalidateRecurring();
  redirect(`/recurring/${id}`);
}

export async function setRecurringPaused(
  id: string,
  paused: boolean,
): Promise<ActionResult> {
  await requireSession();
  const [schedule] = await db
    .select()
    .from(recurringInvoices)
    .where(eq(recurringInvoices.id, id));
  if (!schedule) return { error: "Recurring invoice not found." };

  let next = schedule.nextIssueDate;
  if (!paused) {
    // Resuming skips the dates missed while paused rather than issuing a
    // backlog of invoices on the next run.
    const today = todayISO();
    while (next < today) {
      next = nextIssueDate(next, schedule.interval, schedule.anchorDay);
    }
  }
  await db
    .update(recurringInvoices)
    .set({ pausedAt: paused ? new Date() : null, nextIssueDate: next })
    .where(eq(recurringInvoices.id, id));
  revalidateRecurring();
  return {};
}

/** Deletes the schedule; invoices it already created stay, unlinked. */
export async function deleteRecurring(id: string): Promise<ActionResult> {
  await requireSession();
  const [deleted] = await db
    .delete(recurringInvoices)
    .where(eq(recurringInvoices.id, id))
    .returning({ id: recurringInvoices.id });
  if (!deleted) return { error: "Recurring invoice not found." };
  revalidateRecurring();
  redirect("/recurring");
}
