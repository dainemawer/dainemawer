import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { MonthlyChart } from "@/components/monthly-chart";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  activeCurrencies,
  awaitingQuotes,
  headline,
  monthly,
  overdueInvoices,
  recentActivity,
  topCustomers,
} from "@/lib/dashboard";
import { formatDate, todayISO } from "@/lib/documents";
import { type Currency, formatMoney, isCurrency } from "@/lib/money";
import { getSettings } from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const docPath = (kind: string, id: string) =>
  `/${kind === "quote" ? "quotes" : "invoices"}/${id}`;

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  await requireSession();
  const [{ currency: requested }, settings, currencies] = await Promise.all([
    searchParams,
    getSettings(),
    activeCurrencies(),
  ]);
  const currency: Currency = isCurrency(requested)
    ? requested
    : (currencies[0] ?? settings.defaultCurrency);
  const money = (minor: number) => formatMoney(minor, currency);

  const [stats, months, overdue, awaiting, top, activity] = await Promise.all([
    headline(currency),
    monthly(currency),
    overdueInvoices(currency),
    awaitingQuotes(currency),
    topCustomers(currency),
    recentActivity(),
  ]);
  const today = todayISO();
  const daysLate = (due: string | null) =>
    due ? Math.round((Date.parse(today) - Date.parse(due)) / 864e5) : 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/quotes/new">New quote</Link>
            </Button>
            <Button asChild>
              <Link href="/invoices/new">New invoice</Link>
            </Button>
          </>
        }
      />

      {currencies.length > 1 ? (
        <nav aria-label="Currency" className="mb-6 flex gap-1">
          {currencies.map((c) => (
            <Link
              key={c}
              href={`/?currency=${c}`}
              aria-current={c === currency ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                c === currency
                  ? "border-ink bg-ink text-surface"
                  : "text-muted-foreground hover:text-ink",
              )}
            >
              {c}
            </Link>
          ))}
        </nav>
      ) : null}

      <dl className="mb-12 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-3 xl:grid-cols-6">
        <Tile
          label="Outstanding"
          value={money(stats.outstanding)}
          note={`${stats.outstandingCount} invoice${stats.outstandingCount === 1 ? "" : "s"}`}
          href="/invoices?status=sent"
        />
        <Tile
          label="Overdue"
          value={money(stats.overdue)}
          note={`${stats.overdueCount} invoice${stats.overdueCount === 1 ? "" : "s"}`}
          tone={stats.overdueCount ? "alert" : undefined}
          href="/invoices?status=overdue"
        />
        <Tile label="Paid this month" value={money(stats.paidMonth)} />
        <Tile label="Paid this year" value={money(stats.paidYear)} />
        <Tile
          label="Open quotes"
          value={money(stats.openQuotes)}
          note={`${stats.openQuoteCount} awaiting a reply`}
          href="/quotes?status=sent"
        />
        <Tile
          label="Quote win rate"
          value={
            stats.winRate === null ? "—" : `${Math.round(stats.winRate * 100)}%`
          }
          note={
            stats.decided
              ? `of ${stats.decided} decided, last 12 months`
              : "No decided quotes yet"
          }
        />
      </dl>

      <section className="mb-12" aria-labelledby="monthly">
        <h2 id="monthly" className="mb-4 text-lg font-bold">
          Invoiced and paid, last 12 months
        </h2>
        <MonthlyChart data={months} currency={currency} />
      </section>

      <div className="grid gap-12 lg:grid-cols-2">
        <section aria-labelledby="overdue">
          <h2 id="overdue" className="mb-3 text-lg font-bold">
            Overdue
          </h2>
          {overdue.length ? (
            <List>
              {overdue.map(({ document, company }) => (
                <Row
                  key={document.id}
                  href={docPath("invoice", document.id)}
                  primary={`${document.number} · ${company}`}
                  secondary={`Due ${formatDate(document.dueDate)} · ${daysLate(document.dueDate)} days late`}
                  amount={money(document.totalMinor)}
                />
              ))}
            </List>
          ) : (
            <EmptyState title="Nothing overdue" />
          )}
        </section>

        <section aria-labelledby="awaiting">
          <h2 id="awaiting" className="mb-3 text-lg font-bold">
            Quotes awaiting a reply
          </h2>
          {awaiting.length ? (
            <List>
              {awaiting.map(({ document, company }) => (
                <Row
                  key={document.id}
                  href={docPath("quote", document.id)}
                  primary={`${document.number} · ${company}`}
                  secondary={`Valid until ${formatDate(document.validUntil)}`}
                  amount={money(document.totalMinor)}
                />
              ))}
            </List>
          ) : (
            <EmptyState title="No open quotes" />
          )}
        </section>

        <section aria-labelledby="top">
          <h2 id="top" className="mb-3 text-lg font-bold">
            Top customers this year
          </h2>
          {top.length ? (
            <List>
              {top.map((customer) => (
                <Row
                  key={customer.id}
                  href={`/customers/${customer.id}`}
                  primary={customer.company}
                  amount={money(customer.paid)}
                />
              ))}
            </List>
          ) : (
            <EmptyState title="No payments yet this year" />
          )}
        </section>

        <section aria-labelledby="activity">
          <h2 id="activity" className="mb-3 text-lg font-bold">
            Recent activity
          </h2>
          {activity.length ? (
            <List>
              {activity.map((event) => (
                <Row
                  key={`${event.kind}-${event.documentId}-${event.at}`}
                  href={docPath(event.documentKind, event.documentId)}
                  primary={`${event.number} ${event.kind}`}
                  secondary={`${event.company} · ${formatDate(event.at.slice(0, 10))}`}
                  amount={formatMoney(event.totalMinor, event.currency)}
                />
              ))}
            </List>
          ) : (
            <EmptyState title="Nothing yet">
              Send your first quote to see activity here.
            </EmptyState>
          )}
        </section>
      </div>
    </>
  );
}

function Tile({
  label,
  value,
  note,
  href,
  tone,
}: {
  label: string;
  value: string;
  note?: string;
  href?: string;
  tone?: "alert";
}) {
  return (
    <div className="border-t pt-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-1 text-xl font-medium tabular-nums",
          tone === "alert" && "text-destructive",
        )}
      >
        {value}
      </dd>
      {note ? (
        <dd className="mt-0.5 text-xs text-muted-foreground">
          {href ? (
            <Link
              href={href}
              className="underline-offset-4 hover:text-ink hover:underline"
            >
              {note}
            </Link>
          ) : (
            note
          )}
        </dd>
      ) : null}
    </div>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return <ul className="divide-y border-y">{children}</ul>;
}

function Row({
  href,
  primary,
  secondary,
  amount,
}: {
  href: string;
  primary: string;
  secondary?: string;
  amount: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-baseline justify-between gap-4 py-2.5 text-sm hover:bg-muted/60"
      >
        <span className="min-w-0">
          <span className="block truncate font-medium">{primary}</span>
          {secondary ? (
            <span className="block truncate text-xs text-muted-foreground">
              {secondary}
            </span>
          ) : null}
        </span>
        <span className="shrink-0 tabular-nums">{amount}</span>
      </Link>
    </li>
  );
}
