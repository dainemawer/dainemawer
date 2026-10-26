import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SyncButton } from "@/components/expenses/buttons";
import { ExpensesGate } from "@/components/expenses/gate";
import { SpendingChart } from "@/components/expenses/spending-chart";
import { PageHeader } from "@/components/page-header";
import {
  BarChartSkeleton,
  Bone,
  Loading,
  StatBone,
  times,
  widthFor,
} from "@/components/skeletons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { addDays } from "@/lib/documents";
import { getBalances, getOverview } from "@/lib/expenses/queries";
import {
  categoryTrends,
  monthEnd,
  monthOf,
  monthsBetween,
  netFor,
  taxYearStart,
} from "@/lib/expenses/transactions";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Expenses" };

const money = (minor: number) => formatMoney(minor, "ZAR");

export default function ExpensesPage() {
  return (
    <>
      <PageHeader
        title="Expenses"
        description="Your personal Investec accounts, sorted into categories. Synced every morning at 06:00."
        actions={<SyncButton />}
      />
      <Suspense
        fallback={
          <Loading>
            <OverviewSkeleton />
          </Loading>
        }
      >
        <ExpensesGate>
          <Overview />
        </ExpensesGate>
      </Suspense>
    </>
  );
}

/** The overview's layout, with placeholders for Investec's numbers. */
function OverviewSkeleton() {
  return (
    <>
      <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatBone note />
        <StatBone note />
        <StatBone label="Deductible this tax year" note />
        <StatBone label="To review" note />
      </div>
      <p className="mb-10 text-sm">
        <Bone w="34ch" />
      </p>
      <section className="mb-12">
        <h2 className="text-lg font-bold">Spending per month</h2>
        <p className="mb-4 text-sm">
          <Bone w="48ch" />
        </p>
        <BarChartSkeleton height={200} />
      </section>
      <section>
        <h2 className="mb-1 text-lg font-bold">
          <Bone w="16ch" />
        </h2>
        <p className="mb-4 text-sm">
          <Bone w="56ch" />
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="hidden w-1/3 sm:table-cell" />
              <TableHead className="text-right">This month</TableHead>
              <TableHead className="text-right">Average</TableHead>
              <TableHead className="hidden text-right sm:table-cell">
                Change
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {times(8, (i) => (
              <TableRow key={i} className="hover:bg-transparent">
                <TableCell className="font-medium">
                  <Bone w={widthFor(i, 3)} />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="h-2 rounded-full bg-muted" />
                </TableCell>
                <TableCell className="text-right">
                  <Bone w="9ch" />
                </TableCell>
                <TableCell className="text-right">
                  <Bone w="9ch" />
                </TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  <Bone w="8ch" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </>
  );
}

async function Overview() {
  const { today, categories, totals, review, lastSyncedAt } =
    await getOverview();
  const month = monthOf(today);
  const kinds = new Map(categories.map((c) => [c.id, c.kind]));
  const byId = new Map(categories.map((c) => [c.id, c]));
  const trends = categoryTrends(totals, kinds, month);
  const spendingTrends = trends
    .filter((t) => kinds.get(t.categoryId) === "spending")
    .filter((t) => t.current || t.average)
    .sort((a, b) => b.current - a.current || b.average - a.average);
  const incomeTrends = trends.filter(
    (t) => kinds.get(t.categoryId) === "income" && (t.current || t.average),
  );

  const net = (m: string, kind: "spending" | "income") =>
    totals
      .filter((t) => t.month === m && kinds.get(t.categoryId) === kind)
      .reduce((sum, t) => sum + netFor(kind, t), 0);
  const spent = net(month, "spending");
  const averageSpent = spendingTrends.reduce((sum, t) => sum + t.average, 0);
  const historyMonths = trends[0]?.months ?? 0;
  const income = net(month, "income");
  const taxStart = taxYearStart(today);
  const deductible = totals
    .filter((t) => t.month >= taxStart)
    .reduce((sum, t) => sum + t.deductibleOutMinor, 0);

  // Where the month is heading at this rate; meaningless in its first week.
  const day = Number(today.slice(8, 10));
  const days = Number(monthEnd(month).slice(8, 10));
  const pace = day >= 7 ? Math.round((spent / day) * days) : null;

  // From the first month with data (at most 12 back): no run of empty bars
  // before the history starts.
  const firstMonth = totals.reduce(
    (min, t) => (t.month < min ? t.month : min),
    month,
  );
  const chartMonths = monthsBetween(addDays(today, -334), today)
    .filter((m) => m >= firstMonth)
    .map((m) => ({ month: m, spent: net(m, "spending") }));
  const maxCategory = Math.max(
    ...spendingTrends.map((t) => Math.max(t.current, t.average)),
    1,
  );
  const monthName = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${month}T00:00:00Z`));

  return (
    <>
      <dl className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={`Spent in ${monthName}`} value={money(spent)}>
          {!historyMonths
            ? "No earlier months to compare with yet"
            : pace !== null
              ? // A part-month against whole months always looks good; compare where it's heading.
                `On pace for ${money(pace)}, ${compare(pace, averageSpent).toLowerCase()} your ${historyMonths}-month average of ${money(averageSpent)}`
              : `So far. Your ${historyMonths}-month average is ${money(averageSpent)}`}
        </Stat>
        <Stat label={`Income in ${monthName}`} value={money(income)}>
          {spent || income
            ? `${income >= spent ? "Saved" : "Overspent by"} ${money(Math.abs(income - spent))} so far`
            : null}
        </Stat>
        <Stat label="Deductible this tax year" value={money(deductible)}>
          Business costs since {formatShort(taxStart)}
        </Stat>
        <Stat label="To review" value={String(review)}>
          {review ? (
            <Link
              href="/expenses/review"
              className="underline underline-offset-4"
            >
              Check the uncertain ones
            </Link>
          ) : (
            "Nothing waiting"
          )}
        </Stat>
      </dl>

      <Suspense
        fallback={
          <p className="mb-10 text-sm">
            <Bone w="34ch" />
          </p>
        }
      >
        <Balance />
      </Suspense>

      <section className="mb-12" aria-labelledby="per-month">
        <h2 id="per-month" className="text-lg font-bold">
          Spending per month
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {historyMonths
            ? `The dashed line is your ${historyMonths}-month average, ${money(averageSpent)}. This month is lighter: it isn't over yet.`
            : "This month is lighter: it isn't over yet."}
        </p>
        <SpendingChart data={chartMonths} average={averageSpent} />
      </section>

      <section aria-labelledby="by-category">
        <h2 id="by-category" className="mb-1 text-lg font-bold">
          {monthName} by category
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Against your average for the {historyMonths || "previous"} month
          {historyMonths === 1 ? "" : "s"} before. The tick marks the average.
          Transfers between your accounts aren't counted.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="hidden w-1/3 sm:table-cell">
                <span className="sr-only">Compared with average</span>
              </TableHead>
              <TableHead className="text-right">This month</TableHead>
              <TableHead className="text-right">Average</TableHead>
              <TableHead className="hidden text-right sm:table-cell">
                Change
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {spendingTrends.map((t) => (
              <TableRow key={t.categoryId}>
                <TableCell>
                  <Link
                    href={`/expenses/transactions?month=${month.slice(0, 7)}&category=${t.categoryId}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {byId.get(t.categoryId)?.name}
                  </Link>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Meter
                    value={t.current}
                    average={t.average}
                    max={maxCategory}
                  />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {money(t.current)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {t.months ? money(t.average) : "—"}
                </TableCell>
                <TableCell
                  className={cn(
                    "hidden text-right tabular-nums sm:table-cell",
                    t.months &&
                      t.current > t.average * 1.2 &&
                      t.current - t.average > 50_000
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {t.months ? delta(t.current, t.average) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {incomeTrends.length > 1 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Income by category:{" "}
            {incomeTrends
              .map((t) => `${byId.get(t.categoryId)?.name} ${money(t.current)}`)
              .join(" · ")}
          </p>
        ) : null}
        {lastSyncedAt ? (
          <p className="mt-6 text-xs text-muted-foreground">
            Last new transaction labelled{" "}
            {new Intl.DateTimeFormat("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Africa/Johannesburg",
            }).format(new Date(lastSyncedAt))}
            . This month&apos;s figures grow as card transactions post, usually
            within two days.
          </p>
        ) : null}
      </section>
    </>
  );
}

async function Balance() {
  try {
    const { currentMinor } = await getBalances();
    return (
      <p className="mb-10 text-sm text-muted-foreground">
        Balance across included accounts:{" "}
        <span className="font-medium text-ink tabular-nums">
          {money(currentMinor)}
        </span>
      </p>
    );
  } catch {
    return (
      <p className="mb-10 text-sm text-muted-foreground">
        Couldn&apos;t load the balance from Investec.
      </p>
    );
  }
}

function Stat({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-t pt-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-medium tabular-nums">{value}</dd>
      {children ? (
        <dd className="mt-1 text-xs text-muted-foreground">{children}</dd>
      ) : null}
    </div>
  );
}

/** A thin bar for this month with a tick at the average: magnitude in one ink. */
function Meter({
  value,
  average,
  max,
}: {
  value: number;
  average: number;
  max: number;
}) {
  const pct = (v: number) => `${Math.min(100, (Math.max(v, 0) / max) * 100)}%`;
  return (
    <div className="relative h-2 rounded-full bg-muted" aria-hidden="true">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-ink"
        style={{ width: pct(value) }}
      />
      {average > 0 ? (
        <div
          className="absolute -inset-y-1 w-0.5 bg-muted-foreground"
          style={{ left: pct(average) }}
        />
      ) : null}
    </div>
  );
}

function compare(current: number, average: number) {
  if (!average) return "Compared with";
  const pct = Math.round(((current - average) / average) * 100);
  if (Math.abs(pct) < 3) return "In line with";
  return pct > 0 ? `${pct}% above` : `${-pct}% below`;
}

function delta(current: number, average: number) {
  const diff = current - average;
  if (!diff) return "—";
  return `${diff > 0 ? "+" : "−"}${money(Math.abs(diff))}`;
}

function formatShort(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
