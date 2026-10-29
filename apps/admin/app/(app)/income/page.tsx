import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Bone, Loading, times, widthFor } from "@/components/skeletons";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/documents";
import { type IncomeLine, randTotal } from "@/lib/income";
import { getIncomeYear, incomeYears } from "@/lib/income-report";
import {
  type AmountsByCurrency,
  addAmount,
  formatAmounts,
  formatMoney,
} from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Income" };

const rand = (minor: number) => formatMoney(minor, "ZAR");

export default function IncomePage({ searchParams }: PageProps<"/income">) {
  return (
    <>
      <PageHeader
        title="Income"
        description="Paid invoices in rand. Foreign currency is valued at the European Central Bank's reference rate on the day it was paid, before any conversion. Tax years run March to February."
      />
      <Suspense
        fallback={
          <Loading>
            <IncomeSkeleton />
          </Loading>
        }
      >
        <Income searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function IncomeSkeleton() {
  return (
    <>
      <dl className="mb-10 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
        <Stat label="Income in rand" value={<Bone w="12ch" />} />
        <Stat label="Paid invoices" value={<Bone w="3ch" />} />
      </dl>
      <Table>
        <TableHeader>
          <Header />
        </TableHeader>
        <TableBody>
          {times(5, (i) => (
            <TableRow key={i} className="hover:bg-transparent">
              <TableCell>
                <Bone w="9ch" />
              </TableCell>
              <TableCell>
                <Bone w={widthFor(i)} />
              </TableCell>
              <TableCell className="text-right">
                <Bone w="9ch" />
              </TableCell>
              <TableCell className="text-right">
                <Bone w="7ch" />
              </TableCell>
              <TableCell className="text-right">
                <Bone w="10ch" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

async function Income({
  searchParams,
}: Pick<PageProps<"/income">, "searchParams">) {
  const [{ year: requested }, years] = await Promise.all([
    searchParams,
    incomeYears(),
  ]);
  const start = years.includes(Number(requested))
    ? Number(requested)
    : years[0];
  const income = await getIncomeYear(start);

  return (
    <>
      {years.length > 1 ? (
        <nav aria-label="Tax year" className="mb-6 flex flex-wrap gap-1">
          {years.map((y) => (
            <Link
              key={y}
              href={`/income?year=${y}`}
              aria-current={y === start ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                y === start
                  ? "border-ink bg-ink text-surface"
                  : "text-muted-foreground hover:text-ink",
              )}
            >
              {y + 1}
            </Link>
          ))}
        </nav>
      ) : null}
      <Year {...income} />
    </>
  );
}

function Year({
  year,
  lines,
  total,
}: Awaited<ReturnType<typeof getIncomeYear>>) {
  const original = lines.reduce<AmountsByCurrency>(
    (sum, line) => addAmount(sum, line.currency, line.totalMinor),
    {},
  );
  const missing = lines.filter((l) => l.randMinor === null);
  const months = byMonth(lines);

  return (
    <>
      <h2 className="mb-1 text-lg font-bold">{year.label}</h2>
      <p className="mb-6 text-sm text-muted-foreground">{year.span}</p>
      <dl className="mb-10 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
        <Stat label="Income in rand" value={rand(total)} />
        <Stat
          label="Paid invoices"
          value={String(lines.length)}
          note={lines.length ? formatAmounts(original, "USD") : undefined}
        />
      </dl>
      {missing.length ? (
        <p className="mb-6 text-sm text-destructive">
          {missing.length} payment{missing.length === 1 ? " has" : "s have"} no
          exchange rate and {missing.length === 1 ? "isn't" : "aren't"} in the
          total: {missing.map((l) => l.number).join(", ")}. Frankfurter may be
          down; try again shortly.
        </p>
      ) : null}

      {lines.length ? (
        <div className="grid grid-cols-1 gap-12 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <section aria-labelledby="payments" className="min-w-0">
            <h3 id="payments" className="mb-3 font-bold">
              Payments
            </h3>
            <Table>
              <TableHeader>
                <Header />
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {formatDate(line.paidAt)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/invoices/${line.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {line.number}
                      </Link>
                      <span className="text-muted-foreground">
                        {" "}
                        · {line.company}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(line.totalMinor, line.currency)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      <Rate line={line} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {line.randMinor === null ? "—" : rand(line.randMinor)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="font-medium">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {rand(total)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </section>
          <section aria-labelledby="months">
            <h3 id="months" className="mb-3 font-bold">
              By month
            </h3>
            <ul className="divide-y border-y text-sm">
              {months.map(([month, minor]) => (
                <li
                  key={month}
                  className="flex justify-between gap-4 py-2 tabular-nums"
                >
                  <span>{monthLabel(month)}</span>
                  <span>{rand(minor)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : (
        <EmptyState title="Nothing paid in this tax year yet" />
      )}

      <p className="mt-10 max-w-2xl text-xs text-muted-foreground">
        The rate is the ECB's rand rate for the day the invoice was marked paid,
        or (marked *) the last working day before it, for weekends and holidays.
        Mark invoices paid on the day the money arrived (in Wise, for dollars),
        so the rate matches. What you get later when converting, and Wise's
        fees, aren't part of this figure. Confirm the method with your
        accountant before filing.
      </p>
    </>
  );
}

function Header() {
  return (
    <TableRow>
      <TableHead>Paid</TableHead>
      <TableHead>Invoice</TableHead>
      <TableHead className="text-right">Amount</TableHead>
      <TableHead className="text-right">Rate</TableHead>
      <TableHead className="text-right">In rand</TableHead>
    </TableRow>
  );
}

function Rate({ line }: { line: IncomeLine }) {
  if (line.currency === "ZAR") return "—";
  if (line.rate === null) return "No rate";
  const rate = `R${line.rate.toFixed(4)}`;
  // Say so when the rate is from an earlier day (a weekend or holiday).
  return line.rateDate && line.rateDate !== line.paidAt ? (
    <span title={`ECB rate of ${formatDate(line.rateDate)}`}>
      {rate}
      <span className="sr-only"> (rate of {formatDate(line.rateDate)})</span>
      <span aria-hidden="true">*</span>
    </span>
  ) : (
    rate
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="border-t pt-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-medium tabular-nums">{value}</dd>
      {note ? (
        <dd className="mt-0.5 text-xs text-muted-foreground">{note}</dd>
      ) : null}
    </div>
  );
}

function byMonth(lines: IncomeLine[]): [string, number][] {
  const months = new Map<string, IncomeLine[]>();
  for (const line of lines) {
    const month = line.paidAt.slice(0, 7);
    months.set(month, [...(months.get(month) ?? []), line]);
  }
  return [...months].map(([month, list]) => [month, randTotal(list)]);
}

const monthFormat = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const monthLabel = (month: string) =>
  monthFormat.format(new Date(`${month}-01T00:00:00Z`));
