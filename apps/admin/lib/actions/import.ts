"use server";

import { isNotNull } from "drizzle-orm";
import { updateTag } from "next/cache";
import { db } from "@/db";
import { customers, documents, lineItems } from "@/db/schema";
import { audit } from "@/lib/audit";
import { TAG } from "@/lib/cache-tags";
import {
  type DisplayStatus,
  type DocumentKind,
  displayStatus,
  todayISO,
} from "@/lib/documents";
import { errorMessage } from "@/lib/errors";
import type { Currency } from "@/lib/money";
import { allocateNumber } from "@/lib/numbering";
import { requireSession } from "@/lib/session";
import { computeTotals } from "@/lib/totals";
import { planZohoImport, readZohoFiles } from "@/lib/zoho-import";

export type ImportOutcome = {
  error?: string;
  committed?: boolean;
  customers?: { company: string; existing: boolean }[];
  documents?: {
    kind: DocumentKind;
    zohoNumber: string;
    /** The admin's number: new, or the one it got on an earlier import. */
    number: string;
    alreadyImported: boolean;
    company: string;
    /** As the list pages show it: overdue and expired worked out for today. */
    status: DisplayStatus;
    totalMinor: number;
    currency: Currency;
  }[];
  warnings?: string[];
  problems?: string[];
  unknownFiles?: string[];
};

/** Thrown to roll a preview back once it has worked out the outcome. */
class Preview extends Error {
  constructor(readonly outcome: ImportOutcome) {
    super("preview");
  }
}

/** Status timestamps from a date: midday in Cape Town, so the day never shifts. */
const at = (date: string | null) =>
  date ? new Date(`${date}T12:00:00+02:00`) : null;

const sameName = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Imports Zoho Invoice CSV exports. Without `commit`, it runs the whole
 * import (numbers included) and rolls it back, so the preview is exactly
 * what Import will do. Customers already in the admin are matched by email
 * or company name and left as they are; documents imported before (by
 * Zoho number) are skipped.
 */
export async function importFromZoho(
  formData: FormData,
): Promise<ImportOutcome> {
  await requireSession();
  const commit = formData.get("commit") === "1";
  const uploads = formData
    .getAll("files")
    .filter((file): file is File => file instanceof File && file.size > 0);
  if (!uploads.length) {
    return { error: "Choose the CSV files you exported from Zoho." };
  }
  if (uploads.length > 10 || uploads.some((file) => file.size > 5_000_000)) {
    return { error: "Up to 10 files of 5 MB each." };
  }

  const { files, unknown } = readZohoFiles(
    await Promise.all(
      uploads.map(async (file) => ({
        name: file.name,
        text: await file.text(),
      })),
    ),
  );
  const plan = planZohoImport(files);
  if (!plan.customers.length && !plan.documents.length) {
    return {
      error: plan.problems.length
        ? `Nothing can be imported: ${plan.problems[0]}`
        : "None of those files look like Zoho Invoice exports.",
    };
  }

  let outcome: ImportOutcome;
  try {
    outcome = await db.transaction(async (tx) => {
      const known = await tx
        .select({
          id: customers.id,
          company: customers.company,
          emails: customers.emails,
        })
        .from(customers);
      const customerIds = new Map<string, { id: string; company: string }>();
      const customerRows: NonNullable<ImportOutcome["customers"]> = [];
      for (const planned of plan.customers) {
        const match = known.find(
          (c) =>
            c.emails.some((email) =>
              planned.emails.includes(email.toLowerCase()),
            ) || sameName(c.company, planned.company),
        );
        if (match) {
          customerIds.set(planned.zohoId, match);
          customerRows.push({ company: match.company, existing: true });
          continue;
        }
        const { zohoId: _, ...values } = planned;
        const [created] = await tx
          .insert(customers)
          .values(values)
          .returning({ id: customers.id, company: customers.company });
        known.push({ ...created, emails: planned.emails });
        customerIds.set(planned.zohoId, created);
        customerRows.push({ company: created.company, existing: false });
      }

      const imported = await tx
        .select({
          id: documents.id,
          kind: documents.kind,
          number: documents.number,
          importedNumber: documents.importedNumber,
        })
        .from(documents)
        .where(isNotNull(documents.importedNumber));
      const quoteIds = new Map(
        imported
          .filter((d) => d.kind === "quote")
          .map((d) => [d.importedNumber as string, d.id]),
      );
      const linkedQuotes = new Set<string>();

      const documentRows: NonNullable<ImportOutcome["documents"]> = [];
      const today = todayISO();
      for (const doc of plan.documents) {
        const customer = customerIds.get(doc.customerZohoId);
        if (!customer) continue;
        const row = {
          kind: doc.kind,
          zohoNumber: doc.zohoNumber,
          company: customer.company,
          status: displayStatus(doc, today),
          totalMinor: doc.totalMinor,
          currency: doc.currency,
        };
        const earlier = imported.find(
          (d) => d.kind === doc.kind && d.importedNumber === doc.zohoNumber,
        );
        if (earlier) {
          documentRows.push({
            ...row,
            number: earlier.number,
            alreadyImported: true,
          });
          continue;
        }

        // One live invoice per quote (documents_source_quote_idx).
        const quoteId = doc.fromQuote ? quoteIds.get(doc.fromQuote) : undefined;
        const sourceQuoteId =
          quoteId && doc.status !== "void" && !linkedQuotes.has(quoteId)
            ? quoteId
            : null;
        if (sourceQuoteId) linkedQuotes.add(sourceQuoteId);

        const totals = computeTotals(doc.lines, 0, 0);
        const number = await allocateNumber(tx, doc.kind, doc.issueDate);
        const [created] = await tx
          .insert(documents)
          .values({
            kind: doc.kind,
            number,
            importedNumber: doc.zohoNumber,
            customerId: customer.id,
            status: doc.status,
            currency: doc.currency,
            issueDate: doc.issueDate,
            validUntil: doc.validUntil,
            dueDate: doc.dueDate,
            title: doc.title,
            notes: doc.notes,
            terms: doc.terms,
            subtotalMinor: totals.subtotalMinor,
            taxMinor: totals.taxMinor,
            totalMinor: totals.totalMinor,
            sourceQuoteId,
            sentAt: at(doc.sentOn),
            acceptedAt: at(doc.acceptedOn),
            declinedAt: at(doc.declinedOn),
            voidedAt: at(doc.voidedOn),
            paidAt: doc.paidAt,
            paymentRef: doc.paymentRef,
          })
          .returning({ id: documents.id });
        await tx.insert(lineItems).values(
          doc.lines.map((line, position) => ({
            documentId: created.id,
            position,
            description: line.description,
            quantityHundredths: line.quantityHundredths,
            unitPriceMinor: line.unitPriceMinor,
            amountMinor: totals.lineAmounts[position],
          })),
        );
        if (doc.kind === "quote") quoteIds.set(doc.zohoNumber, created.id);
        documentRows.push({ ...row, number, alreadyImported: false });
      }

      const result: ImportOutcome = {
        committed: commit,
        customers: customerRows,
        documents: documentRows,
        warnings: plan.warnings,
        problems: plan.problems,
        unknownFiles: unknown,
      };
      if (!commit) throw new Preview(result);
      return result;
    });
  } catch (error) {
    if (error instanceof Preview) return error.outcome;
    return { error: errorMessage(error, "Couldn't import.") };
  }

  const added = (outcome.customers ?? []).filter((c) => !c.existing).length;
  const docs = (outcome.documents ?? []).filter((d) => !d.alreadyImported);
  if (added || docs.length) {
    updateTag(TAG.customers);
    updateTag(TAG.documents);
    const quotes = docs.filter((d) => d.kind === "quote").length;
    await audit(
      "data-imported",
      `${added} customers, ${quotes} quotes, ${docs.length - quotes} invoices`,
    );
  }
  return outcome;
}
