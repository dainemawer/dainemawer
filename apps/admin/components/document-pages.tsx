import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentActions } from "@/components/document-actions";
import { type CustomerOption, DocumentForm } from "@/components/document-form";
import { DocumentTable } from "@/components/document-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  type DisplayStatus,
  type DocumentKind,
  formatDate,
} from "@/lib/documents";
import { formatMoney, minorToInput } from "@/lib/money";
import {
  documentDefaults,
  getDocument,
  getSettings,
  listCustomers,
  listDocuments,
} from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { fillTemplate } from "@/lib/templates";
import { formatQuantity, formatTaxRate } from "@/lib/totals";
import { cn } from "@/lib/utils";

// Quotes and invoices share every page; app/(app)/quotes/* and
// app/(app)/invoices/* are one-line wrappers that pass their kind.

const LABEL = { quote: "Quote", invoice: "Invoice" } as const;
const PLURAL = { quote: "Quotes", invoice: "Invoices" } as const;
const base = (kind: DocumentKind) =>
  kind === "quote" ? "/quotes" : "/invoices";

const FILTERS: Record<DocumentKind, DisplayStatus[]> = {
  quote: ["draft", "sent", "accepted", "declined", "expired"],
  invoice: ["draft", "sent", "overdue", "paid", "void"],
};

export async function DocumentListPage({
  kind,
  status,
}: {
  kind: DocumentKind;
  status?: string;
}) {
  await requireSession();
  const all = await listDocuments(kind);
  const filter = FILTERS[kind].find((s) => s === status);
  const rows = filter ? all.filter((row) => row.status === filter) : all;

  return (
    <>
      <PageHeader
        title={PLURAL[kind]}
        actions={
          <Button asChild>
            <Link href={`${base(kind)}/new`}>New {kind}</Link>
          </Button>
        }
      />
      <nav aria-label="Filter by status" className="mb-6 flex flex-wrap gap-1">
        {[undefined, ...FILTERS[kind]].map((s) => {
          const count = s
            ? all.filter((row) => row.status === s).length
            : all.length;
          return (
            <Link
              key={s ?? "all"}
              href={s ? `${base(kind)}?status=${s}` : base(kind)}
              aria-current={filter === s ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-xs capitalize transition-colors",
                filter === s
                  ? "border-ink bg-ink text-surface"
                  : "text-muted-foreground hover:border-ink/40 hover:text-ink",
              )}
            >
              {s ?? "All"}{" "}
              <span className="tabular-nums opacity-70">{count}</span>
            </Link>
          );
        })}
      </nav>
      {rows.length ? (
        <DocumentTable rows={rows} />
      ) : (
        <EmptyState
          title={
            filter
              ? `No ${filter} ${PLURAL[kind].toLowerCase()}`
              : `No ${PLURAL[kind].toLowerCase()} yet`
          }
        />
      )}
    </>
  );
}

async function customerOptions(includeId?: string): Promise<CustomerOption[]> {
  const rows = await listCustomers();
  const options = rows.map(({ customer }) => ({
    id: customer.id,
    company: customer.company,
    currency: customer.currency,
    termsDays: customer.termsDays,
  }));
  // Keep an archived customer selectable on documents that already use it.
  if (includeId && !options.some((o) => o.id === includeId)) {
    const archived = await listCustomers({ archived: true });
    const match = archived.find(({ customer }) => customer.id === includeId);
    if (match) {
      options.push({
        id: match.customer.id,
        company: `${match.customer.company} (archived)`,
        currency: match.customer.currency,
        termsDays: match.customer.termsDays,
      });
    }
  }
  return options;
}

export async function NewDocumentPage({
  kind,
  customerId,
}: {
  kind: DocumentKind;
  customerId?: string;
}) {
  await requireSession();
  const [customers, defaults] = await Promise.all([
    customerOptions(),
    documentDefaults(kind, customerId),
  ]);
  const validCustomer = customers.some((c) => c.id === customerId)
    ? customerId
    : "";

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href={base(kind)} className="hover:text-ink">
            {PLURAL[kind]}
          </Link>
        }
        title={`New ${kind}`}
      />
      {customers.length === 0 ? (
        <EmptyState title="Add a customer first">
          <Link
            href={`/customers/new?returnTo=${base(kind)}/new`}
            className="underline underline-offset-4"
          >
            Create a customer
          </Link>{" "}
          to {kind === "quote" ? "quote" : "invoice"} them.
        </EmptyState>
      ) : (
        <DocumentForm
          kind={kind}
          customers={customers}
          initial={{
            customerId: validCustomer ?? "",
            currency: defaults.currency,
            issueDate: defaults.issueDate,
            validUntil: defaults.validUntil,
            dueDate: defaults.dueDate,
            title: "",
            notes: defaults.notes,
            terms: defaults.terms,
            discount: "",
            taxRate: formatTaxRate(defaults.taxRateBp),
            lines: [],
          }}
        />
      )}
    </>
  );
}

export async function EditDocumentPage({
  kind,
  id,
}: {
  kind: DocumentKind;
  id: string;
}) {
  await requireSession();
  const full = await getDocument(id);
  if (!full || full.document.kind !== kind) notFound();
  const { document, lines } = full;
  const customers = await customerOptions(document.customerId);

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href={`${base(kind)}/${id}`} className="hover:text-ink">
            {document.number}
          </Link>
        }
        title={`Edit ${kind}`}
        description={
          document.status === "sent"
            ? kind === "quote"
              ? "Saving returns this quote to draft; send it again to share the changes."
              : "This invoice has been sent. It keeps its number; send it again to share the changes."
            : undefined
        }
      />
      <DocumentForm
        kind={kind}
        number={document.number}
        customers={customers}
        initial={{
          id: document.id,
          customerId: document.customerId,
          currency: document.currency,
          issueDate: document.issueDate,
          validUntil: document.validUntil ?? "",
          dueDate: document.dueDate ?? "",
          title: document.title ?? "",
          notes: document.notes ?? "",
          terms: document.terms ?? "",
          discount: document.discountMinor
            ? minorToInput(document.discountMinor)
            : "",
          taxRate: formatTaxRate(document.taxRateBp),
          lines: lines.map((line) => ({
            description: line.description,
            quantity: formatQuantity(line.quantityHundredths),
            unitPrice: minorToInput(line.unitPriceMinor),
          })),
        }}
      />
    </>
  );
}

export async function DocumentDetailPage({
  kind,
  id,
}: {
  kind: DocumentKind;
  id: string;
}) {
  await requireSession();
  const full = await getDocument(id);
  if (!full || full.document.kind !== kind) notFound();
  const { document, customer, sends, status } = full;
  const settings = await getSettings();
  const money = (minor: number) => formatMoney(minor, document.currency);

  const vars = {
    number: document.number,
    business: settings.businessName,
    contact: customer.contactName?.split(" ")[0] || "there",
    company: customer.company,
    total: money(document.totalMinor),
    validUntil: formatDate(document.validUntil),
    dueDate: formatDate(document.dueDate),
  };
  const isQuote = kind === "quote";
  const emailDefaults = {
    to: customer.emails.join(", "),
    cc: customer.ccEmail ?? "",
    subject: fillTemplate(
      isQuote ? settings.quoteEmailSubject : settings.invoiceEmailSubject,
      vars,
    ),
    body: fillTemplate(
      isQuote ? settings.quoteEmailBody : settings.invoiceEmailBody,
      vars,
    ),
  };
  const lastSend = sends[0];
  const changedSinceSend = lastSend && document.editedAt > lastSend.sentAt;

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href={base(kind)} className="hover:text-ink">
            {PLURAL[kind]}
          </Link>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="tabular-nums">{document.number}</span>
            <StatusBadge status={status} />
          </span>
        }
        description={
          <>
            <Link
              href={`/customers/${customer.id}`}
              className="underline-offset-4 hover:text-ink hover:underline"
            >
              {customer.company}
            </Link>
            {document.title ? ` · ${document.title}` : null}
          </>
        }
        actions={
          <DocumentActions
            id={id}
            kind={kind}
            status={document.status}
            emailDefaults={emailDefaults}
            hasBeenSent={sends.length > 0}
          />
        }
      />

      {changedSinceSend ? (
        <p className="mb-6 rounded-lg border border-warning/40 bg-warning/5 px-4 py-3 text-sm text-warning">
          Edited since it was last sent on{" "}
          {formatDate(lastSend.sentAt.toISOString().slice(0, 10))}. Send it
          again so {customer.company} has the current version.
        </p>
      ) : null}

      <dl className="mb-8 grid gap-6 sm:grid-cols-4">
        <Stat
          label={isQuote ? "Total" : status === "paid" ? "Paid" : "Amount due"}
          value={money(document.totalMinor)}
          strong
        />
        <Stat label="Issued" value={formatDate(document.issueDate)} />
        <Stat
          label={isQuote ? "Valid until" : "Due"}
          value={formatDate(isQuote ? document.validUntil : document.dueDate)}
        />
        {document.status === "paid" ? (
          <Stat
            label="Paid on"
            value={`${formatDate(document.paidAt)}${document.paymentRef ? ` · ${document.paymentRef}` : ""}`}
          />
        ) : document.sourceQuoteId ? (
          <div className="border-t pt-3">
            <dt className="text-xs text-muted-foreground">From quote</dt>
            <dd className="mt-1">
              <Link
                href={`/quotes/${document.sourceQuoteId}`}
                className="underline underline-offset-4"
              >
                View quote
              </Link>
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="grid gap-10 xl:grid-cols-[1fr_22rem]">
        <section aria-label="PDF preview">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Preview</h2>
            <a
              href={`/documents/${id}/pdf?download=1`}
              className="text-sm text-muted-foreground underline-offset-4 hover:text-ink hover:underline"
            >
              Download PDF
            </a>
          </div>
          <iframe
            title={`${LABEL[kind]} ${document.number} PDF`}
            src={`/documents/${id}/pdf#view=FitH&toolbar=0`}
            className="aspect-[1/1.414] w-full rounded-lg border bg-muted"
          />
        </section>

        <section aria-labelledby="send-log">
          <h2 id="send-log" className="mb-3 text-lg font-bold">
            Sent
          </h2>
          {sends.length === 0 ? (
            <p className="text-sm text-muted-foreground">Not sent yet.</p>
          ) : (
            <ol className="grid gap-4">
              {sends.map((send) => (
                <li key={send.id} className="border-t pt-3 text-sm">
                  <div className="font-medium">
                    {new Intl.DateTimeFormat("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Africa/Johannesburg",
                    }).format(send.sentAt)}
                  </div>
                  <div className="text-muted-foreground">
                    To {send.to.join(", ")}
                    {send.cc.length ? `, cc ${send.cc.join(", ")}` : ""}
                  </div>
                  <div className="truncate text-muted-foreground">
                    “{send.subject}”
                  </div>
                  {send.pdfPathname ? (
                    <a
                      href={`/sends/${send.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block underline underline-offset-4"
                    >
                      PDF as sent
                    </a>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="border-t pt-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("mt-1 tabular-nums", strong && "text-xl font-medium")}>
        {value}
      </dd>
    </div>
  );
}
