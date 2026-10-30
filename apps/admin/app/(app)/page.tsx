import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarSkeleton, CalendarTile } from "@/components/hud/calendar";
import { Clock } from "@/components/hud/clock";
import { FxSkeleton, FxTile } from "@/components/hud/fx";
import { HealthSkeleton, HealthTile } from "@/components/hud/health";
import { LinearSkeleton, LinearTile } from "@/components/hud/linear";
import { WeatherTile } from "@/components/hud/weather";
import { MonthlyChart } from "@/components/monthly-chart";
import { PageHeader } from "@/components/page-header";
import { BarChartSkeleton, Bone, Loading } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { getMoneyInOut } from "@/lib/expenses/queries";
import { getIncomeSummary } from "@/lib/income-report";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        breadcrumbs={false}
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
      {/* The clock and weather only run in the browser, so they sit in the
          static shell; the calendar, rates and Linear are data and stream in
          their own boundaries, health included.
          data-wide: the dashboard fills the screen (the `dashboard` variant
          in globals.css); it must stay a direct child of <main>. */}
      <div
        data-wide
        className="mb-12 grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2 xl:grid-cols-3"
      >
        <Clock />
        <WeatherTile />
        <Suspense fallback={<CalendarSkeleton />}>
          <CalendarTile />
        </Suspense>
        <Suspense fallback={<FxSkeleton />}>
          <FxTile />
        </Suspense>
        <Suspense fallback={<LinearSkeleton />}>
          <LinearTile />
        </Suspense>
        <Suspense fallback={<HealthSkeleton />}>
          <HealthTile />
        </Suspense>
      </div>
      <Suspense
        fallback={
          <Loading>
            <MoneySkeleton />
          </Loading>
        }
      >
        <Money />
      </Suspense>
    </>
  );
}

const rand = (minor: number) => formatMoney(minor, "ZAR");

const monthName = (month: string) =>
  new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" }).format(
    new Date(`${month.slice(0, 7)}-01T00:00:00Z`),
  );

/**
 * Money this month: what came into and went out of the Investec accounts
 * (the Expenses sums: transfers between your own accounts left out), and
 * income by stream (Fueled, freelance) from invoice payments in rand.
 */
async function Money() {
  const [money, income] = await Promise.all([
    getMoneyInOut(),
    getIncomeSummary(),
  ]);
  const now = money.months.at(-1) ?? {
    month: money.today,
    inMinor: 0,
    outMinor: 0,
  };
  const left = now.inMinor - now.outMinor;
  const [employment, freelance] = income.streams;
  const month = monthName(money.today);

  return (
    <MoneyLayout
      month={month}
      tiles={
        <>
          <Tile
            label={`Money in, ${month}`}
            value={money.connected ? rand(now.inMinor) : "—"}
            note={
              money.connected ? "Investec, so far" : "Expenses isn't synced yet"
            }
            href="/expenses"
          />
          <Tile
            label={`Money out, ${month}`}
            value={money.connected ? rand(now.outMinor) : "—"}
            note="Transfers left out"
          />
          <Tile
            label="Left over"
            value={money.connected ? rand(left) : "—"}
            tone={money.connected && left < 0 ? "alert" : undefined}
          />
          <Tile
            label={`${employment.label}, ${month}`}
            value={rand(employment.month)}
            note="Invoice payments in rand"
            href="/income"
          />
          <Tile
            label={`${freelance.label}, ${month}`}
            value={rand(freelance.month)}
          />
        </>
      }
      chart={
        money.connected ? (
          <MonthlyChart
            data={money.months.map((m) => ({
              month: m.month.slice(0, 7),
              values: [m.inMinor, m.outMinor],
            }))}
            labels={["Money in", "Money out"]}
            title="Money in and out per month, last 12 months"
            currency="ZAR"
          />
        ) : (
          <p className="rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
            Connect Investec on the{" "}
            <Link href="/expenses" className="underline underline-offset-4">
              Expenses
            </Link>{" "}
            page to see money in and out.
          </p>
        )
      }
      income={
        <IncomeTable
          rows={income.streams.map((s) => ({
            label: s.label,
            month: rand(s.month),
            year: rand(s.year),
            lastYear: rand(s.lastYear),
          }))}
          total={{
            month: rand(income.month),
            year: rand(income.year),
            lastYear: rand(income.lastYear),
          }}
          yearLabel={income.current.label}
          lastYearLabel={income.previous.label}
          note={
            income.missing
              ? `${income.missing} payment${income.missing === 1 ? "" : "s"} missing an exchange rate.`
              : null
          }
        />
      }
    />
  );
}

/** The same layout with placeholders where the numbers go. */
function MoneySkeleton() {
  const value = <Bone w="10ch" />;
  const rows = ["Employment", "Freelance"].map((label) => ({
    label,
    month: value,
    year: value,
    lastYear: value,
  }));
  return (
    <MoneyLayout
      month={<Bone w="8ch" />}
      tiles={
        <>
          <Tile label="Money in" value={value} />
          <Tile label="Money out" value={value} />
          <Tile label="Left over" value={value} />
          <Tile label="Employment" value={value} />
          <Tile label="Freelance" value={value} />
        </>
      }
      chart={<BarChartSkeleton height={220} paired />}
      income={
        <IncomeTable
          rows={rows}
          total={{ month: value, year: value, lastYear: value }}
          yearLabel="This tax year"
          lastYearLabel="Last tax year"
        />
      }
    />
  );
}

function MoneyLayout({
  month,
  tiles,
  chart,
  income,
}: {
  month: React.ReactNode;
  tiles: React.ReactNode;
  chart: React.ReactNode;
  income: React.ReactNode;
}) {
  return (
    <section aria-labelledby="money">
      <h2 id="money" className="mb-4 text-lg font-bold">
        Money, {month}
      </h2>
      <dl className="mb-12 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-3 xl:grid-cols-5">
        {tiles}
      </dl>
      {/* Stacked, unless the dashboard has the room (a wide screen): then
          side by side, which keeps the chart's text at a readable size. */}
      <div className="@container">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-12 @min-[56rem]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <section aria-labelledby="in-out">
            <h3 id="in-out" className="mb-4 font-bold">
              In and out, last 12 months
            </h3>
            {chart}
          </section>
          <section aria-labelledby="income">
            <h3 id="income" className="mb-4 font-bold">
              <Link
                href="/income"
                className="underline-offset-4 hover:underline"
              >
                Income in rand
              </Link>
            </h3>
            {income}
          </section>
        </div>
      </div>
    </section>
  );
}

/** Each stream (Fueled, freelance) this month, this tax year and last. */
function IncomeTable({
  rows,
  total,
  yearLabel,
  lastYearLabel,
  note,
}: {
  rows: {
    label: React.ReactNode;
    month: React.ReactNode;
    year: React.ReactNode;
    lastYear: React.ReactNode;
  }[];
  total: {
    month: React.ReactNode;
    year: React.ReactNode;
    lastYear: React.ReactNode;
  };
  yearLabel: React.ReactNode;
  lastYearLabel: React.ReactNode;
  note?: string | null;
}) {
  const cell = "py-2.5 text-right tabular-nums";
  return (
    <>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[26rem] text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th scope="col" className="py-2 text-left font-normal">
                <span className="sr-only">Stream</span>
              </th>
              <th scope="col" className="py-2 text-right font-normal">
                This month
              </th>
              <th scope="col" className="py-2 text-right font-normal">
                {yearLabel}
              </th>
              <th scope="col" className="py-2 text-right font-normal">
                {lastYearLabel}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: two fixed rows
              <tr key={i}>
                <th scope="row" className="py-2.5 text-left font-medium">
                  {row.label}
                </th>
                <td className={cell}>{row.month}</td>
                <td className={cell}>{row.year}</td>
                <td className={cell}>{row.lastYear}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t">
              <th scope="row" className="py-2.5 text-left font-medium">
                Total
              </th>
              <td className={cn(cell, "font-medium")}>{total.month}</td>
              <td className={cn(cell, "font-medium")}>{total.year}</td>
              <td className={cn(cell, "font-medium")}>{total.lastYear}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p
        className={cn(
          "mt-3 text-xs",
          note ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {note ??
          "Payments on invoices, at the ECB rate on the day each arrived. Set a customer's income type when editing it."}
      </p>
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
  label: React.ReactNode;
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
