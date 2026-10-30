import type { Metadata } from "next";
import { Suspense } from "react";
import { EmptyState } from "@/components/empty-state";
import { SubscriptionButton } from "@/components/expenses/buttons";
import { ExpensesGate, InvestecError } from "@/components/expenses/gate";
import { PageHeader } from "@/components/page-header";
import { Bone, Loading } from "@/components/skeletons";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/documents";
import { getSubscriptions } from "@/lib/expenses/queries";
import { subscriptionTotals } from "@/lib/expenses/subscriptions";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Subscriptions" };

const money = (minor: number) => formatMoney(minor, "ZAR");

type Row = Awaited<
  ReturnType<typeof getSubscriptions>
>["subscriptions"][number];

export default function SubscriptionsPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={false}
        title="Subscriptions"
        description="Charges that come back every month for about the same amount, found in the last 180 days of your accounts. Yearly ones don't repeat in that window, so they won't show."
      />
      <Suspense
        fallback={
          <Loading>
            <Stats monthly={<Bone w="10ch" />} yearly={<Bone w="12ch" />} />
            <TableFrame title="Active">
              {[0, 1, 2, 3, 4].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Bone w="16ch" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Bone w="8ch" />
                  </TableCell>
                  <TableCell>
                    <Bone w="9ch" />
                  </TableCell>
                  <TableCell>
                    <Bone w="9ch" />
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))}
            </TableFrame>
          </Loading>
        }
      >
        <ExpensesGate>
          <Subscriptions />
        </ExpensesGate>
      </Suspense>
    </>
  );
}

async function Subscriptions() {
  let data: Awaited<ReturnType<typeof getSubscriptions>>;
  try {
    data = await getSubscriptions();
  } catch {
    return <InvestecError />;
  }
  const status = (row: Row) => row.state?.status ?? "tracking";
  const tracking = data.subscriptions.filter((s) => status(s) === "tracking");
  const active = tracking.filter((s) => !s.stopped);
  const stopped = tracking.filter((s) => s.stopped);
  const hidden = data.subscriptions.filter((s) => status(s) !== "tracking");
  // Cancelled, yet charged since: the one thing here that needs doing.
  const chargedAfter = hidden.filter(
    (s) =>
      status(s) === "cancelled" &&
      s.state?.cancelledOn &&
      s.lastDate > s.state.cancelledOn,
  );
  const totals = subscriptionTotals(active);

  if (!data.subscriptions.length) {
    return (
      <EmptyState title="No subscriptions found">
        Nothing charged monthly at a steady amount in the last 180 days. A
        subscription shows up after its third charge.
      </EmptyState>
    );
  }

  return (
    <>
      {chargedAfter.length ? (
        <section
          aria-labelledby="charged-after"
          className="mb-10 rounded-lg border border-destructive/40 p-4"
        >
          <h2 id="charged-after" className="font-bold text-destructive">
            Charged after you cancelled
          </h2>
          <ul className="mt-2 grid gap-1 text-sm">
            {chargedAfter.map((s) => (
              <li key={s.key}>
                {s.merchant}: {money(s.amountMinor)} on {formatDate(s.lastDate)}{" "}
                (cancelled {formatDate(s.state?.cancelledOn ?? null)}). Check it
                was really cancelled, or ask for a refund.
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Stats
        monthly={money(totals.monthlyMinor)}
        yearly={money(totals.yearlyMinor)}
        note={`${active.length} subscription${active.length === 1 ? "" : "s"}`}
      />

      {active.length ? (
        <TableFrame title="Active">
          {active.map((s) => (
            <TableRow key={s.key}>
              <MerchantCell row={s}>
                {s.priceRise ? (
                  <Badge variant="destructive">
                    Up from {money(s.previousMinor)}
                  </Badge>
                ) : null}
                {s.isNew ? <Badge variant="secondary">New</Badge> : null}
              </MerchantCell>
              <TableCell className="text-right tabular-nums">
                {money(s.amountMinor)}
              </TableCell>
              <TableCell className="tabular-nums text-muted-foreground">
                {formatDate(s.lastDate)}
              </TableCell>
              <TableCell className="tabular-nums text-muted-foreground">
                {formatDate(s.nextDate)}
              </TableCell>
              <Actions row={s} />
            </TableRow>
          ))}
        </TableFrame>
      ) : null}

      {stopped.length ? (
        <TableFrame
          title="Possibly stopped"
          hint="The next charge is more than ten days late: cancelled, or moved to a card that isn't synced."
          next="Was due"
        >
          {stopped.map((s) => (
            <TableRow key={s.key}>
              <MerchantCell row={s} />
              <TableCell className="text-right tabular-nums">
                {money(s.amountMinor)}
              </TableCell>
              <TableCell className="tabular-nums text-muted-foreground">
                {formatDate(s.lastDate)}
              </TableCell>
              <TableCell className="tabular-nums text-muted-foreground">
                {formatDate(s.nextDate)}
              </TableCell>
              <Actions row={s} />
            </TableRow>
          ))}
        </TableFrame>
      ) : null}

      {hidden.length ? (
        <TableFrame
          title="Cancelled or not subscriptions"
          hint="Left out of the totals."
          next="Status"
        >
          {hidden.map((s) => (
            <TableRow key={s.key} className="text-muted-foreground">
              <MerchantCell row={s} />
              <TableCell className="text-right tabular-nums">
                {money(s.amountMinor)}
              </TableCell>
              <TableCell className="tabular-nums">
                {formatDate(s.lastDate)}
              </TableCell>
              <TableCell>
                {status(s) === "cancelled"
                  ? `Cancelled ${formatDate(s.state?.cancelledOn ?? null)}`
                  : "Not a subscription"}
              </TableCell>
              <TableCell className="text-right">
                <SubscriptionButton
                  subscriptionKey={s.key}
                  merchant={s.merchant}
                  status="tracking"
                >
                  Track again
                </SubscriptionButton>
              </TableCell>
            </TableRow>
          ))}
        </TableFrame>
      ) : null}
    </>
  );
}

function Stats({
  monthly,
  yearly,
  note,
}: {
  monthly: React.ReactNode;
  yearly: React.ReactNode;
  note?: string;
}) {
  return (
    <dl className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div className="border-t pt-3">
        <dt className="text-xs text-muted-foreground">A month</dt>
        <dd className="mt-1 text-xl font-medium tabular-nums">{monthly}</dd>
        {note ? (
          <dd className="mt-1 text-xs text-muted-foreground">{note}</dd>
        ) : null}
      </div>
      <div className="border-t pt-3">
        <dt className="text-xs text-muted-foreground">A year</dt>
        <dd className="mt-1 text-xl font-medium tabular-nums">{yearly}</dd>
        <dd className="mt-1 text-xs text-muted-foreground">
          At today's prices
        </dd>
      </div>
    </dl>
  );
}

function TableFrame({
  title,
  hint,
  next = "Next",
  children,
}: {
  title: string;
  hint?: string;
  next?: string;
  children: React.ReactNode;
}) {
  const id = title.toLowerCase().replace(/\W+/g, "-");
  return (
    <section aria-labelledby={id} className="mb-12">
      <h2 id={id} className="text-lg font-bold">
        {title}
      </h2>
      {hint ? (
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      ) : null}
      <div className="relative mt-4 overflow-x-auto">
        <Table className="min-w-[40rem]">
          <TableHeader>
            <TableRow>
              <TableHead>Merchant</TableHead>
              <TableHead className="text-right">A month</TableHead>
              <TableHead>Last charged</TableHead>
              <TableHead>{next}</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{children}</TableBody>
        </Table>
      </div>
    </section>
  );
}

function MerchantCell({
  row,
  children,
}: {
  row: Row;
  children?: React.ReactNode;
}) {
  return (
    <TableCell>
      <span className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-ink">{row.merchant}</span>
        {children}
      </span>
      <span className="block text-xs text-muted-foreground">
        {[row.category, `${row.charges} charges`].filter(Boolean).join(" · ")}
      </span>
    </TableCell>
  );
}

function Actions({ row }: { row: Row }) {
  return (
    <TableCell className="text-right whitespace-nowrap">
      <SubscriptionButton
        subscriptionKey={row.key}
        merchant={row.merchant}
        status="cancelled"
      >
        I cancelled it
      </SubscriptionButton>
      <SubscriptionButton
        subscriptionKey={row.key}
        merchant={row.merchant}
        status="ignored"
      >
        Not a subscription
      </SubscriptionButton>
    </TableCell>
  );
}
