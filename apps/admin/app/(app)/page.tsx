import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/empty-state";
import { Clock } from "@/components/hud/clock";
import { WeatherTile } from "@/components/hud/weather";
import { MonthlyChart } from "@/components/monthly-chart";
import { PageHeader } from "@/components/page-header";
import {
  BarChartSkeleton,
  Bone,
  Loading,
  times,
  widthFor,
} from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { activeCurrencies, getDashboard } from "@/lib/dashboard";
import { formatDate, todayISO } from "@/lib/documents";
import { type Currency, formatMoney, isCurrency } from "@/lib/money";
import { getSettings } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const docPath = (kind: string, id: string) =>
  `/${kind === "quote" ? "quotes" : "invoices"}/${id}`;

export default function DashboardPage({ searchParams }: PageProps<"/">) {
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
      {/* The HUD only fetches from the browser (weather) or reads its clock,
          so it sits in the static shell, outside the data's boundary. */}
      <div className="mb-12 grid gap-x-12 gap-y-8 md:grid-cols-2">
        <Clock />
        <WeatherTile />
      </div>
      <Suspense
        fallback={
          <Loading>
            <DashboardSkeleton />
          </Loading>
        }
      >
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </>
  );
}

/** The dashboard as it will look, with placeholders where the numbers go. */
function DashboardSkeleton() {
  const value = <Bone w="9ch" />;
  const note = <Bone w="11ch" />;
  const rows = (secondary: boolean) =>
    times(4, (i) => (
      <Row
        key={i}
        primary={<Bone w={widthFor(i)} />}
        secondary={secondary ? <Bone w={widthFor(i, 3)} /> : undefined}
        amount={<Bone w="8ch" />}
      />
    ));
  return (
    <>
      <dl className="mb-12 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-3 xl:grid-cols-6">
        <Tile label="Outstanding" value={value} note={note} />
        <Tile label="Overdue" value={value} note={note} />
        <Tile label="Paid this month" value={value} />
        <Tile label="Paid this year" value={value} />
        <Tile label="Open quotes" value={value} note={note} />
        <Tile label="Quote win rate" value={<Bone w="4ch" />} note={note} />
      </dl>
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-bold">
          Invoiced and paid, last 12 months
        </h2>
        <figure>
          <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm bg-[#c4c4c4]" />
              Invoiced
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm bg-ink" />
              Paid
            </span>
          </div>
          <BarChartSkeleton height={220} paired />
        </figure>
      </section>
      <div className="grid gap-12 lg:grid-cols-2">
        {(
          [
            ["Overdue", true],
            ["Quotes awaiting a reply", true],
            ["Top customers this year", false],
            ["Recent activity", true],
          ] as const
        ).map(([title, secondary]) => (
          <section key={title}>
            <h2 className="mb-3 text-lg font-bold">{title}</h2>
            <List>{rows(secondary)}</List>
          </section>
        ))}
      </div>
    </>
  );
}

async function Dashboard({
  searchParams,
}: Pick<PageProps<"/">, "searchParams">) {
  const [{ currency: requested }, settings, currencies] = await Promise.all([
    searchParams,
    getSettings(),
    activeCurrencies(),
  ]);
  const currency: Currency = isCurrency(requested)
    ? requested
    : (currencies[0] ?? settings.defaultCurrency);
  const money = (minor: number) => formatMoney(minor, currency);

  const { today, stats, months, overdue, awaiting, top, activity } =
    await getDashboard(currency);
  const daysLate = (due: string | null) =>
    due ? Math.round((Date.parse(today) - Date.parse(due)) / 864e5) : 0;

  return (
    <>
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
                  secondary={`${event.company} · ${formatDate(todayISO(new Date(event.at)))}`}
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
  value: React.ReactNode;
  note?: React.ReactNode;
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

/** Without `href` (the skeleton) the row is plain, not a link. */
function Row({
  href,
  primary,
  secondary,
  amount,
}: {
  href?: string;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  amount: React.ReactNode;
}) {
  const content = (
    <>
      <span className="min-w-0">
        <span className="block truncate font-medium">{primary}</span>
        {secondary ? (
          <span className="block truncate text-xs text-muted-foreground">
            {secondary}
          </span>
        ) : null}
      </span>
      <span className="shrink-0 tabular-nums">{amount}</span>
    </>
  );
  const className = "flex items-baseline justify-between gap-4 py-2.5 text-sm";
  return (
    <li>
      {href ? (
        <Link href={href} className={cn(className, "hover:bg-muted/60")}>
          {content}
        </Link>
      ) : (
        <div className={className}>{content}</div>
      )}
    </li>
  );
}
