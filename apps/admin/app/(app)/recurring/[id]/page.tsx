import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentTable } from "@/components/document-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RecurringActions } from "@/components/recurring-actions";
import { RecurringStatusBadge } from "@/components/recurring-status";
import { formatDate } from "@/lib/documents";
import { formatMoney } from "@/lib/money";
import { getRecurring } from "@/lib/queries";
import { INTERVAL_LABEL } from "@/lib/recurring-dates";
import { requireSession } from "@/lib/session";
import { formatQuantity } from "@/lib/totals";

export async function generateMetadata({
  params,
}: PageProps<"/recurring/[id]">): Promise<Metadata> {
  await requireSession();
  const full = await getRecurring((await params).id);
  return { title: full ? `Recurring · ${full.customer.company}` : "Recurring" };
}

export default async function RecurringDetailPage({
  params,
}: PageProps<"/recurring/[id]">) {
  await requireSession();
  const { id } = await params;
  const full = await getRecurring(id);
  if (!full) notFound();
  const { schedule, customer, lines, invoices, status } = full;
  const money = (minor: number) => formatMoney(minor, schedule.currency);

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/recurring" className="hover:text-ink">
            Recurring
          </Link>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            {customer.company}
            <RecurringStatusBadge status={status} />
          </span>
        }
        description={schedule.title ?? undefined}
        actions={
          status === "ended" ? null : (
            <RecurringActions id={id} paused={status === "paused"} />
          )
        }
      />

      <dl className="mb-10 grid gap-6 sm:grid-cols-4">
        <Stat label="Each invoice" value={money(schedule.totalMinor)} strong />
        <Stat label="Repeats" value={INTERVAL_LABEL[schedule.interval]} />
        <Stat
          label="Next invoice"
          value={
            status === "active"
              ? formatDate(schedule.nextIssueDate)
              : status === "paused"
                ? "Paused"
                : "Ended"
          }
        />
        <Stat
          label="Ends"
          value={schedule.endDate ? formatDate(schedule.endDate) : "Never"}
        />
      </dl>

      <section className="mb-10" aria-labelledby="lines">
        <h2 id="lines" className="mb-3 text-lg font-bold">
          Line items
        </h2>
        <ul className="divide-y border-y text-sm">
          {lines.map((line) => (
            <li key={line.id} className="flex justify-between gap-4 py-3">
              <span className="whitespace-pre-line">{line.description}</span>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {formatQuantity(line.quantityHundredths)} ×{" "}
                {money(line.unitPriceMinor)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          Due {customer.termsDays} days after each issue date.
        </p>
      </section>

      <section aria-labelledby="created">
        <h2 id="created" className="mb-3 text-lg font-bold">
          Invoices created
        </h2>
        {invoices.length ? (
          <DocumentTable rows={invoices} />
        ) : (
          <EmptyState title="None yet">
            The first draft appears on {formatDate(schedule.nextIssueDate)}.
          </EmptyState>
        )}
      </section>
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
      <dd className={strong ? "mt-1 text-xl font-medium tabular-nums" : "mt-1"}>
        {value}
      </dd>
    </div>
  );
}
