import "server-only";
import { and, asc, eq, isNull, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  customers,
  documents,
  lineItems,
  recurringInvoices,
  recurringLines,
} from "@/db/schema";
import { addDays, formatDate, todayISO } from "@/lib/documents";
import { formatMoney } from "@/lib/money";
import { allocateNumber } from "@/lib/numbering";
import { dueIssueDates, nextIssueDate } from "@/lib/recurring-dates";
import { sendTelegram } from "@/lib/telegram";
import { computeTotals } from "@/lib/totals";

// Turns due schedules into draft invoices. Run daily by the cron route
// (app/api/cron/recurring); safe to run more often or twice at once: each
// schedule is locked while it issues, and the unique index on
// (recurring_id, recurring_date) refuses a second invoice for a date.

type Issued = {
  id: string;
  number: string;
  company: string;
  issueDate: string;
  total: string;
};

export async function issueDueInvoices(today = todayISO()) {
  const due = await db
    .select({ id: recurringInvoices.id })
    .from(recurringInvoices)
    .where(
      and(
        isNull(recurringInvoices.pausedAt),
        lte(recurringInvoices.nextIssueDate, today),
      ),
    );
  const issued: Issued[] = [];
  const failed: string[] = [];
  for (const { id } of due) {
    try {
      issued.push(...(await issueSchedule(id, today)));
    } catch (error) {
      // One broken schedule mustn't stop the others; it retries tomorrow.
      console.error(`[recurring] schedule ${id} failed`, error);
      failed.push(id);
    }
  }
  if (issued.length) await notify(issued, today);
  return { issued, failed };
}

async function issueSchedule(id: string, today: string): Promise<Issued[]> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ schedule: recurringInvoices, customer: customers })
      .from(recurringInvoices)
      .innerJoin(customers, eq(customers.id, recurringInvoices.customerId))
      .where(eq(recurringInvoices.id, id))
      .for("update", { of: recurringInvoices });
    if (!row || row.schedule.pausedAt) return [];
    const { schedule, customer } = row;
    const dates = dueIssueDates(schedule, today);
    if (!dates.length) return [];

    const lines = await tx
      .select()
      .from(recurringLines)
      .where(eq(recurringLines.recurringId, id))
      .orderBy(asc(recurringLines.position));
    const totals = computeTotals(
      lines,
      schedule.discountMinor,
      schedule.taxRateBp,
    );

    // Dates this schedule already has an invoice for (its next date was
    // edited back onto one) are skipped, not issued twice.
    const existing = new Set(
      (
        await tx
          .select({ date: documents.recurringDate })
          .from(documents)
          .where(eq(documents.recurringId, id))
      ).map((invoice) => invoice.date),
    );

    const issued: Issued[] = [];
    for (const issueDate of dates) {
      if (existing.has(issueDate)) continue;
      const number = await allocateNumber(tx, "invoice", issueDate);
      const [invoice] = await tx
        .insert(documents)
        .values({
          kind: "invoice",
          number,
          customerId: schedule.customerId,
          currency: schedule.currency,
          issueDate,
          dueDate: addDays(issueDate, customer.termsDays),
          title: schedule.title,
          notes: schedule.notes,
          terms: schedule.terms,
          discountMinor: schedule.discountMinor,
          taxRateBp: schedule.taxRateBp,
          subtotalMinor: totals.subtotalMinor,
          taxMinor: totals.taxMinor,
          totalMinor: totals.totalMinor,
          recurringId: id,
          recurringDate: issueDate,
        })
        .returning({ id: documents.id });
      if (lines.length) {
        await tx.insert(lineItems).values(
          lines.map((line, position) => ({
            documentId: invoice.id,
            position,
            description: line.description,
            quantityHundredths: line.quantityHundredths,
            unitPriceMinor: line.unitPriceMinor,
            amountMinor: totals.lineAmounts[position],
          })),
        );
      }
      issued.push({
        id: invoice.id,
        number,
        company: customer.company,
        issueDate,
        total: formatMoney(totals.totalMinor, schedule.currency),
      });
    }

    await tx
      .update(recurringInvoices)
      .set({
        nextIssueDate: nextIssueDate(
          dates[dates.length - 1],
          schedule.interval,
          schedule.anchorDay,
        ),
      })
      .where(eq(recurringInvoices.id, id));
    return issued;
  });
}

/** One Telegram message listing the new drafts; nothing goes to clients. */
async function notify(issued: Issued[], today: string) {
  const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3001";
  const count = issued.length;
  await sendTelegram(
    {
      title: `${count} recurring invoice${count === 1 ? "" : "s"} ready to review`,
      lines: issued.map(
        (invoice) =>
          `${invoice.number} · ${invoice.company} · ${invoice.total}` +
          (invoice.issueDate === today
            ? ""
            : ` (for ${formatDate(invoice.issueDate)})`),
      ),
      url:
        count === 1
          ? `${base}/invoices/${issued[0].id}`
          : `${base}/invoices?status=draft`,
    },
    { quiet: true },
  );
}
