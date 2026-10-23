// Quotes and invoices share one table and one shape; this module holds the
// rules that differ by kind — numbering, statuses, and which statuses are
// derived from dates rather than stored.

export const DOCUMENT_KINDS = ["quote", "invoice"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const STORED_STATUSES = [
  "draft",
  "sent",
  "accepted",
  "declined",
  "paid",
  "void",
] as const;
export type StoredStatus = (typeof STORED_STATUSES)[number];

/** What the UI shows: the stored status, or `expired`/`overdue` worked out from today's date. */
export type DisplayStatus = StoredStatus | "expired" | "overdue";

export const NUMBER_PREFIX: Record<DocumentKind, string> = {
  quote: "Q",
  invoice: "INV",
};

/** `("invoice", 2026, 7)` → `INV-2026-0007`. */
export function formatDocumentNumber(
  kind: DocumentKind,
  year: number,
  sequence: number,
): string {
  return `${NUMBER_PREFIX[kind]}-${year}-${String(sequence).padStart(4, "0")}`;
}

type StatusInput = {
  kind: DocumentKind;
  status: StoredStatus;
  validUntil: string | null;
  dueDate: string | null;
};

/** ISO dates (`YYYY-MM-DD`) compare correctly as strings, so no Date objects here. */
export function displayStatus(doc: StatusInput, today: string): DisplayStatus {
  if (doc.status !== "sent") return doc.status;
  if (doc.kind === "quote" && doc.validUntil && doc.validUntil < today) {
    return "expired";
  }
  if (doc.kind === "invoice" && doc.dueDate && doc.dueDate < today) {
    return "overdue";
  }
  return "sent";
}

/** Which manual transitions the detail page offers for a stored status. */
export function allowedActions(kind: DocumentKind, status: StoredStatus) {
  return {
    edit: status !== "void" && status !== "paid",
    send: status !== "void" && status !== "declined",
    accept: kind === "quote" && status === "sent",
    decline: kind === "quote" && status === "sent",
    convert: kind === "quote" && status === "accepted",
    markPaid: kind === "invoice" && status === "sent",
    void: kind === "invoice" && (status === "draft" || status === "sent"),
    // Deleting an invoice would leave a gap in its numbering, so invoices
    // are voided instead.
    delete: kind === "quote" && status === "draft",
  };
}

// Business days run on Cape Town time, not the server's UTC — an invoice
// due "today" shouldn't flip to overdue at 2am local.
export const TIME_ZONE = "Africa/Johannesburg";

export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** `2026-10-23` → `23 Oct 2026`. */
export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}
