import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DocumentActions } from "@/components/document-actions";
import { type CustomerOption, DocumentForm } from "@/components/document-form";
import {
  DocumentTable,
  DocumentTableSkeleton,
} from "@/components/document-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import {
  Bone,
  FormSkeleton,
  HeaderSkeleton,
  Loading,
  PillBone,
  Skeleton,
  StatBone,
  times,
} from "@/components/skeletons";
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
import { fillTemplate } from "@/lib/templates";
import { formatQuantity, formatTaxRate } from "@/lib/totals";
import { cn } from "@/lib/utils";

// Quotes and invoices share every page; app/(app)/quotes/* and
// app/(app)/invoices/* are one-line wrappers that pass their kind.
//
// Each page renders what it can without data (headings, buttons) straight
// into the static shell and streams the rest behind <Suspense>. The data
// reads check the session themselves (lib/queries.ts).

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Params = Promise<{ id: string }>;

const LABEL = { quote: "Quote", invoice: "Invoice" } as const;
const PLURAL = { quote: "Quotes", invoice: "Invoices" } as const;
const base = (kind: DocumentKind) =>
  kind === "quote" ? "/quotes" : "/invoices";

const FILTERS: Record<DocumentKind, DisplayStatus[]> = {
  quote: ["draft", "sent", "accepted", "declined", "expired"],
  invoice: ["draft", "sent", "overdue", "paid", "void"],
};

export function DocumentListPage({
  kind,
  searchParams,
}: {
  kind: DocumentKind;
  searchParams: SearchParams;
}) {
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
      <Suspense
        fallback={
          <Loading>
            <FilterChips kind={kind} />
            <DocumentTableSkeleton kind={kind} />
          </Loading>
        }
      >
        <DocumentList kind={kind} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function DocumentList({
  kind,
  searchParams,
}: {
  kind: DocumentKind;
  searchParams: SearchParams;
}) {
  const [{ status }, all] = await Promise.all([
    searchParams,
    listDocuments(kind),
  ]);
  const filter = FILTERS[kind].find((s) => s === status);
  const rows = filter ? all.filter((row) => row.status === filter) : all;

  return (
    <>
      <FilterChips kind={kind} filter={filter} all={all} />
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

/** The status filter; without `all` (still loading) the counts are placeholders. */
function FilterChips({
  kind,
  filter,
  all,
}: {
  kind: DocumentKind;
  filter?: DisplayStatus;
  all?: { status: DisplayStatus }[];
}) {
  return (
    <nav aria-label="Filter by status" className="mb-6 flex flex-wrap gap-1">
      {[undefined, ...FILTERS[kind]].map((s) => {
        const count = !all
          ? null
          : s
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
            <span className="tabular-nums opacity-70">
              {count ?? <Bone w="1ch" />}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export async function customerOptions(
  includeId?: string,
): Promise<CustomerOption[]> {
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

export function NewDocumentPage({
  kind,
  searchParams,
}: {
  kind: DocumentKind;
  searchParams: SearchParams;
}) {
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
      <Suspense
        fallback={
          <Loading>
            <FormSkeleton />
          </Loading>
        }
      >
        <NewDocument kind={kind} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function NewDocument({
  kind,
  searchParams,
}: {
  kind: DocumentKind;
  searchParams: SearchParams;
}) {
  // ?customer=<id> from a customer's page, or back from "Add a new customer".
  const { customer } = await searchParams;
  const customerId = typeof customer === "string" ? customer : undefined;
  const [customers, defaults] = await Promise.all([
    customerOptions(),
    documentDefaults(kind, customerId),
  ]);
  const validCustomer = customers.some((c) => c.id === customerId)
    ? customerId
    : "";

  return (
    <>
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

export function EditDocumentPage({
  kind,
  params,
}: {
  kind: DocumentKind;
  params: Params;
}) {
  return (
    <Suspense
      fallback={
        <Loading>
          <HeaderSkeleton />
          <FormSkeleton />
        </Loading>
      }
    >
      <EditDocument kind={kind} params={params} />
    </Suspense>
  );
}

async function EditDocument({
  kind,
  params,
}: {
  kind: DocumentKind;
  params: Params;
}) {
  const { id } = await params;
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

export function DocumentDetailPage({
  kind,
  params,
}: {
  kind: DocumentKind;
  params: Params;
}) {
  return (
    <Suspense
      fallback={
        <Loading>
          <DocumentDetailSkeleton kind={kind} />
        </Loading>
      }
    >
      <DocumentDetail kind={kind} params={params} />
    </Suspense>
  );
}

/** For the detail routes' generateMetadata. */
export async function documentTitle(params: Params, fallback: string) {
  const full = await getDocument((await params).id);
  return { title: full?.document.number ?? fallback };
}

async function DocumentDetail({
  kind,
  params,
}: {
  kind: DocumentKind;
  params: Params;
}) {
  const { id } = await params;
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
        ) : document.recurringId ? (
          <div className="border-t pt-3">
            <dt className="text-xs text-muted-foreground">Created from</dt>
            <dd className="mt-1">
              <Link
                href={`/recurring/${document.recurringId}`}
                className="underline underline-offset-4"
              >
                Recurring invoice
              </Link>
            </dd>
          </div>
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

/** The detail page while it loads: same header, stats, preview and send log. */
function DocumentDetailSkeleton({ kind }: { kind: DocumentKind }) {
  const isQuote = kind === "quote";
  return (
    <>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1 text-xs text-muted-foreground">
            {PLURAL[kind]}
          </div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold">
            <Bone w="11ch" />
            <PillBone w="3.25rem" />
          </h1>
          <p className="mt-1 text-sm">
            <Bone w="20ch" />
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {times(3, (i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>
      </header>
      <div className="mb-8 grid gap-6 sm:grid-cols-4">
        <StatBone label={isQuote ? "Total" : undefined} />
        <StatBone label="Issued" strong={false} />
        <StatBone label={isQuote ? "Valid until" : "Due"} strong={false} />
      </div>
      <div className="grid gap-10 xl:grid-cols-[1fr_22rem]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Preview</h2>
            <span className="text-sm text-muted-foreground">Download PDF</span>
          </div>
          <Skeleton className="aspect-[1/1.414] w-full rounded-lg border" />
        </section>
        <section>
          <h2 className="mb-3 text-lg font-bold">Sent</h2>
          <div className="grid gap-4">
            {times(2, (i) => (
              <div key={i} className="grid border-t pt-3 text-sm">
                <span className="font-medium">
                  <Bone w="16ch" />
                </span>
                <span>
                  <Bone w="22ch" />
                </span>
                <span>
                  <Bone w="18ch" />
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
