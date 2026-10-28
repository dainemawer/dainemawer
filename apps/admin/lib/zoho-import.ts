// Turns Zoho Invoice's CSV exports (Customers, Invoices, Quotes or
// Estimates, Payments Received) into rows for the admin's tables. Pure: no
// database, so the tests can import it. lib/actions/import.ts applies the
// plan inside one transaction and allocates the admin's own numbers.
//
// Anything the admin can't hold exactly (a total that doesn't match its
// lines, a fourth decimal place, an unknown currency) is reported as a
// problem and left out rather than imported slightly wrong.

import { parseCsv } from "@/lib/csv";
import type { DocumentKind, StoredStatus } from "@/lib/documents";
import { type Currency, formatMoney, isCurrency } from "@/lib/money";
import { computeTotals, type LineInput } from "@/lib/totals";

type Row = Record<string, string>;

export type ZohoFiles = {
  contacts: Row[];
  quotes: Row[];
  invoices: Row[];
  payments: Row[];
};

export type PlannedCustomer = {
  zohoId: string;
  company: string;
  contactName: string | null;
  emails: string[];
  address: string | null;
  currency: Currency;
  termsDays: number;
  notes: string | null;
};

export type PlannedLine = LineInput & { description: string };

export type PlannedDocument = {
  kind: DocumentKind;
  zohoNumber: string;
  customerZohoId: string;
  status: StoredStatus;
  currency: Currency;
  issueDate: string;
  validUntil: string | null;
  dueDate: string | null;
  title: string | null;
  notes: string | null;
  terms: string | null;
  lines: PlannedLine[];
  totalMinor: number;
  /** The Zoho quote an invoice was converted from. */
  fromQuote: string | null;
  /** Dates for the status timestamps, ISO. */
  sentOn: string | null;
  acceptedOn: string | null;
  declinedOn: string | null;
  voidedOn: string | null;
  paidAt: string | null;
  paymentRef: string | null;
};

export type ImportPlan = {
  customers: PlannedCustomer[];
  /** Quotes, then invoices (so invoices can link to their quote), each by issue date. */
  documents: PlannedDocument[];
  /** Imported, but not exactly as in Zoho. */
  warnings: string[];
  /** Left out. */
  problems: string[];
};

/** Sorts uploads into Zoho's modules by their header row, whatever the file is called. */
export function readZohoFiles(uploads: { name: string; text: string }[]) {
  const files: ZohoFiles = {
    contacts: [],
    quotes: [],
    invoices: [],
    payments: [],
  };
  const unknown: string[] = [];
  for (const upload of uploads) {
    const rows = parseCsv(upload.text);
    const columns = new Set(Object.keys(rows[0] ?? {}));
    const module = columns.has("CustomerPayment ID")
      ? "payments"
      : columns.has("Invoice ID")
        ? "invoices"
        : columns.has("Quote ID") || columns.has("Estimate ID")
          ? "quotes"
          : columns.has("Display Name") && columns.has("Customer ID")
            ? "contacts"
            : null;
    if (module) files[module].push(...rows);
    else unknown.push(upload.name);
  }
  return { files, unknown };
}

/** The first of these columns the row has (Zoho renamed Estimates to Quotes). */
function pick(row: Row, ...columns: string[]) {
  for (const column of columns) {
    if (column in row) return row[column].trim();
  }
  return "";
}

/** "2026/08/09" or "2026-08-09" → "2026-08-09". Day-first formats are ambiguous, so they're refused. */
export function zohoDate(value: string): string | null {
  const match = /^(\d{4})[-/](\d{2})[-/](\d{2})/.exec(value.trim());
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

/** "10320.000" → 1032000. Null if it needs more than two decimal places. */
export function hundredths(value: string): number | null {
  const match = /^(-?)(\d*)(?:\.(\d*))?$/.exec(value.trim().replace(/,/g, ""));
  if (!match || (match[2] === "" && !match[3])) return null;
  const [, sign, whole, fraction = ""] = match;
  if (/[^0]/.test(fraction.slice(2))) return null;
  const n =
    Number(whole || "0") * 100 + Number(fraction.slice(0, 2).padEnd(2, "0"));
  return sign ? -n : n;
}

/** Groups line rows by document ID, keeping Zoho's order. */
function group(rows: Row[], idColumns: string[]) {
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const id = pick(row, ...idColumns);
    if (!id) continue;
    groups.set(id, [...(groups.get(id) ?? []), row]);
  }
  return [...groups.values()];
}

const INVOICE_STATUS: Record<string, StoredStatus> = {
  draft: "draft",
  sent: "sent",
  viewed: "sent",
  unpaid: "sent",
  overdue: "sent",
  partially_paid: "sent",
  paid: "paid",
  void: "void",
};

const QUOTE_STATUS: Record<string, StoredStatus> = {
  draft: "draft",
  sent: "sent",
  viewed: "sent",
  expired: "sent",
  accepted: "accepted",
  invoiced: "accepted",
  declined: "declined",
};

export function planZohoImport(files: ZohoFiles): ImportPlan {
  const warnings: string[] = [];
  const problems: string[] = [];

  const customers = new Map<string, PlannedCustomer>();
  for (const row of files.contacts) {
    const zohoId = pick(row, "Customer ID");
    if (!zohoId || customers.has(zohoId)) continue;
    if (pick(row, "Contact Type").toLowerCase() === "vendor") continue;
    const company =
      pick(row, "Company Name") ||
      pick(row, "Display Name") ||
      pick(row, "Customer Name");
    const currency = pick(row, "Currency Code") || "ZAR";
    if (!isCurrency(currency)) {
      problems.push(`${company}: the admin doesn't bill in ${currency}.`);
      continue;
    }
    const phone = pick(row, "Phone") || pick(row, "MobilePhone");
    customers.set(zohoId, {
      zohoId,
      company,
      contactName:
        `${pick(row, "First Name")} ${pick(row, "Last Name")}`.trim() ||
        pick(row, "Billing Attention") ||
        null,
      emails: pick(row, "EmailID")
        .split(/[;,\s]+/)
        .map((email) => email.toLowerCase())
        .filter(Boolean),
      address:
        [
          pick(row, "Billing Address"),
          pick(row, "Billing Street2"),
          pick(row, "Billing City"),
          `${pick(row, "Billing State")} ${pick(row, "Billing Code")}`.trim(),
          pick(row, "Billing Country"),
        ]
          .filter(Boolean)
          .join("\n") || null,
      currency,
      termsDays: Math.max(
        0,
        Number.parseInt(pick(row, "Payment Terms"), 10) || 0,
      ),
      notes:
        [pick(row, "Notes"), phone ? `Phone: ${phone}` : ""]
          .filter(Boolean)
          .join("\n") || null,
    });
  }

  const payments = new Map<string, Row[]>();
  for (const row of files.payments) {
    const invoice = pick(row, "Invoice Number");
    if (invoice) payments.set(invoice, [...(payments.get(invoice) ?? []), row]);
  }

  const documents: PlannedDocument[] = [];
  const sources = [
    {
      kind: "quote" as const,
      rows: group(files.quotes, ["Quote ID", "Estimate ID"]),
    },
    { kind: "invoice" as const, rows: group(files.invoices, ["Invoice ID"]) },
  ];
  for (const { kind, rows } of sources) {
    for (const lines of rows) {
      const head = lines[0];
      const isQuote = kind === "quote";
      const zohoNumber = isQuote
        ? pick(head, "Quote Number", "Estimate Number")
        : pick(head, "Invoice Number");
      const fail = (reason: string) =>
        problems.push(`${zohoNumber}: ${reason}`);

      const customerZohoId = pick(head, "Customer ID");
      if (!customers.has(customerZohoId)) {
        fail(
          `its customer (${pick(head, "Customer Name")}) isn't in the Customers export.`,
        );
        continue;
      }
      const currency = pick(head, "Currency Code");
      if (!isCurrency(currency)) {
        fail(`the admin doesn't bill in ${currency || "an unknown currency"}.`);
        continue;
      }
      const issueDate = zohoDate(
        isQuote
          ? pick(head, "Quote Date", "Estimate Date")
          : pick(head, "Invoice Date"),
      );
      if (!issueDate) {
        fail(
          "its date isn't in a format the import reads. Set Zoho's date format to yyyy/MM/dd and export again.",
        );
        continue;
      }

      const planned: PlannedLine[] = [];
      for (const line of lines) {
        const name = pick(line, "Item Name");
        const desc = pick(line, "Item Desc");
        const quantityHundredths = hundredths(pick(line, "Quantity"));
        const unitPriceMinor = hundredths(pick(line, "Item Price"));
        if (quantityHundredths === null || unitPriceMinor === null) break;
        planned.push({
          description:
            [name, desc && desc !== name ? desc : ""]
              .filter(Boolean)
              .join("\n") || "Item",
          quantityHundredths,
          unitPriceMinor,
        });
      }
      if (planned.length !== lines.length) {
        fail(
          "a line has a quantity or price with more than two decimal places.",
        );
        continue;
      }
      const totals = computeTotals(planned, 0, 0);
      const zohoTotal = hundredths(pick(head, "Total"));
      if (zohoTotal !== totals.totalMinor) {
        fail(
          `Zoho's total is ${formatMoney(zohoTotal ?? 0, currency)} but its lines add up to ${formatMoney(totals.totalMinor, currency)}. Discounts, tax, shipping and adjustments don't import; add it by hand.`,
        );
        continue;
      }

      const zohoStatus = pick(
        head,
        "Quote Status",
        "Estimate Status",
        "Invoice Status",
      )
        .toLowerCase()
        .replace(/\s+/g, "_");
      let status = (isQuote ? QUOTE_STATUS : INVOICE_STATUS)[zohoStatus];
      if (!status) {
        status = "draft";
        warnings.push(
          `${zohoNumber} is "${zohoStatus}" in Zoho; it comes in as a draft.`,
        );
      }

      const balance = hundredths(pick(head, "Balance"));
      if (
        !isQuote &&
        status === "sent" &&
        balance !== null &&
        balance < totals.totalMinor
      ) {
        warnings.push(
          `${zohoNumber} has ${formatMoney(totals.totalMinor - balance, currency)} of ${formatMoney(totals.totalMinor, currency)} paid in Zoho. The admin records whole payments only, so it comes in unpaid; mark it paid when the rest arrives.`,
        );
      }

      const paid = payments.get(zohoNumber) ?? [];
      const lastPayment =
        zohoDate(pick(head, "Last Payment Date")) ??
        paid
          .map((p) => zohoDate(pick(p, "Date")))
          .filter(Boolean)
          .sort()
          .pop() ??
        issueDate;
      const refs = paid.map((p) => pick(p, "Reference Number")).filter(Boolean);

      const later = (date: string | null) =>
        date && date >= issueDate ? date : null;
      const due = later(zohoDate(pick(head, "Due Date")));
      documents.push({
        kind,
        zohoNumber,
        customerZohoId,
        status,
        currency,
        issueDate,
        validUntil: isQuote ? later(zohoDate(pick(head, "Expiry Date"))) : null,
        dueDate: isQuote ? null : (due ?? issueDate),
        title: pick(head, "Subject") || null,
        notes: pick(head, "Notes") || null,
        terms: pick(head, "Terms & Conditions") || null,
        lines: planned,
        totalMinor: totals.totalMinor,
        fromQuote: isQuote
          ? null
          : pick(head, "Estimate Number", "Quote Number") || null,
        sentOn: status === "draft" ? null : issueDate,
        acceptedOn: status === "accepted" ? issueDate : null,
        declinedOn: status === "declined" ? issueDate : null,
        voidedOn: status === "void" ? issueDate : null,
        paidAt: status === "paid" ? lastPayment : null,
        paymentRef: status === "paid" && refs.length ? refs.join(", ") : null,
      });
    }
  }

  // A quote counts as accepted from the day it was invoiced, when Zoho says.
  for (const invoice of documents) {
    const quote = documents.find(
      (d) => d.kind === "quote" && d.zohoNumber === invoice.fromQuote,
    );
    if (quote?.status === "accepted" && invoice.issueDate >= quote.issueDate) {
      quote.acceptedOn = invoice.issueDate;
    }
  }

  const order = { quote: 0, invoice: 1 };
  documents.sort(
    (a, b) =>
      order[a.kind] - order[b.kind] ||
      a.issueDate.localeCompare(b.issueDate) ||
      a.zohoNumber.localeCompare(b.zohoNumber, "en", { numeric: true }),
  );
  return { customers: [...customers.values()], documents, warnings, problems };
}
