import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DayTicks } from "@/components/health/day-ticks";
import { WeightChart } from "@/components/health/weight-chart";
import { PageHeader } from "@/components/page-header";
import { Bone, Loading, Skeleton, times } from "@/components/skeletons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { addDays, formatDate, TIME_ZONE } from "@/lib/documents";
import { editableDay, formatKg, type HealthRow, kg, PLAN } from "@/lib/health";
import { getCravingsThisWeek, getHealth } from "@/lib/health-data";
import { cravingWindow } from "@/lib/health-messages";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Health" };

export default function HealthPage({ searchParams }: PageProps<"/health">) {
  return (
    <>
      <PageHeader
        title="Health"
        description={`${PLAN.fromKg} → ${PLAN.goalKg} kg at ${PLAN.kgPerWeek} kg a week. No calories: a few habits a day, and the trend instead of the scale.`}
      />
      <Suspense
        fallback={
          <Loading>
            <HealthSkeleton />
          </Loading>
        }
      >
        <Health searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function HealthSkeleton() {
  const value = <Bone w="8ch" />;
  return (
    <>
      <Stats>
        <Stat label="Trend" value={value} />
        <Stat label="This week" value={value} />
        <Stat label="To go" value={value} />
        <Stat label="Goal" value={value} />
      </Stats>
      <Columns>
        <section>
          <h2 className="mb-4 text-lg font-bold">Weight</h2>
          <Skeleton className="aspect-[3/1] w-full" />
        </section>
        <section>
          <h2 className="mb-4 text-lg font-bold">Today</h2>
          <Skeleton className="h-64 w-full" />
        </section>
      </Columns>
    </>
  );
}

async function Health({
  searchParams,
}: Pick<PageProps<"/health">, "searchParams">) {
  const [{ day: requested }, health, cravings] = await Promise.all([
    searchParams,
    getHealth(),
    getCravingsThisWeek(),
  ]);
  const today = health.today.date;
  const selected =
    typeof requested === "string" && editableDay(requested, today)
      ? requested
      : today;
  const day = health.recent.find((d) => d.date === selected) ?? health.today;

  return (
    <>
      <Stats>
        <Stat
          label="Trend"
          value={health.trendKg === null ? "—" : formatKg(health.trendKg)}
          note={
            health.scaleKg !== null
              ? `Scale today ${formatKg(health.scaleKg)}`
              : "No weigh-in today"
          }
        />
        <Stat
          label="This week"
          value={
            health.weeklyKg === null
              ? "—"
              : formatKg(health.weeklyKg, { signed: true })
          }
          note={
            health.weeklyKg === null
              ? "Shows after a week of weigh-ins"
              : `Plan −${PLAN.kgPerWeek} kg`
          }
        />
        <Stat
          label="To go"
          value={
            health.trendKg === null
              ? "—"
              : formatKg(Math.max(0, health.trendKg - PLAN.goalKg))
          }
          note={
            health.targetKg === null
              ? `Goal ${PLAN.goalKg} kg`
              : today < PLAN.start
                ? `Plan starts ${formatDate(PLAN.start)}`
                : `Plan says ${formatKg(health.targetKg)} today`
          }
        />
        <Stat
          label="Goal"
          value={health.planGoal ? formatDate(health.planGoal) : "—"}
          note={
            health.projectedGoal
              ? `At this pace, ${formatDate(health.projectedGoal)}`
              : health.weeklyKg === null
                ? "On the plan's pace"
                : "Not at this week's pace"
          }
        />
      </Stats>

      <Columns>
        <section aria-labelledby="weight" className="min-w-0">
          <h2 id="weight" className="mb-4 text-lg font-bold">
            Weight
          </h2>
          {health.points.length > 1 ? (
            <>
              {/* Drawn at two sizes so its labels stay readable on a phone. */}
              <div className="md:hidden">
                <WeightChart
                  points={health.points}
                  startKg={health.startKg}
                  planGoal={health.planGoal}
                  compact
                />
              </div>
              <div className="hidden md:block">
                <WeightChart
                  points={health.points}
                  startKg={health.startKg}
                  planGoal={health.planGoal}
                />
              </div>
            </>
          ) : (
            <p className="rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
              The trend starts after a couple of weigh-ins. Weigh yourself each
              morning, after the bathroom and before breakfast.
            </p>
          )}
        </section>

        <section aria-labelledby="day">
          <h2 id="day" className="mb-3 text-lg font-bold">
            {selected === today ? "Today" : formatDate(selected)}
          </h2>
          <nav aria-label="Day" className="mb-5 grid grid-cols-7 gap-1">
            {times(7, (i) => {
              const date = addDays(today, i - 6);
              return (
                <Link
                  key={date}
                  href={date === today ? "/health" : `/health?day=${date}`}
                  aria-current={date === selected ? "page" : undefined}
                  className={cn(
                    "rounded-full border py-1 text-center text-xs transition-colors",
                    date === selected
                      ? "border-ink bg-ink text-surface"
                      : "text-muted-foreground hover:text-ink",
                  )}
                >
                  {date === today ? "Today" : weekday(date)}
                </Link>
              );
            })}
          </nav>
          <p className="mb-5 text-sm">
            <span className="text-muted-foreground">Steps </span>
            <span className="tabular-nums">
              {day.steps === null ? "—" : number(day.steps)} of{" "}
              {number(PLAN.steps)}
            </span>
            {day.sleepMinutes !== null ? (
              <>
                <span className="text-muted-foreground"> · Slept </span>
                {hours(day.sleepMinutes)}
              </>
            ) : null}
          </p>
          <DayTicks
            key={selected}
            date={selected}
            ticks={day}
            weightKg={kg(day.weightGrams)}
          />
        </section>
      </Columns>

      <section aria-labelledby="week" className="mt-12">
        <h2 id="week" className="mb-1 text-lg font-bold">
          This week
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {health.workoutsThisWeek} of {PLAN.workoutsPerWeek} workouts. A missed
          day is just a day: the week is what counts.
        </p>
        <WeekGrid week={health.week} today={today} />
      </section>

      <section aria-labelledby="cravings" className="mt-12">
        <h2 id="cravings" className="mb-1 text-lg font-bold">
          Cravings this week
        </h2>
        <Cravings cravings={cravings} />
      </section>

      <section aria-labelledby="recent" className="mt-12">
        <h2 id="recent" className="mb-4 text-lg font-bold">
          Last two weeks
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Day</TableHead>
              <TableHead className="text-right">Weigh-in</TableHead>
              <TableHead className="text-right">Steps</TableHead>
              <TableHead className="text-right">Sleep</TableHead>
              <TableHead className="text-right">Resting HR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {health.recent.map((d) => (
              <TableRow key={d.date}>
                <TableCell className="text-muted-foreground tabular-nums">
                  {weekday(d.date)} {formatDate(d.date)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {d.weightGrams === null
                    ? "—"
                    : formatKg(d.weightGrams / 1000)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {d.steps === null ? "—" : number(d.steps)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {d.sleepMinutes === null ? "—" : hours(d.sleepMinutes)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {d.restingHr === null ? "—" : `${d.restingHr} bpm`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="mt-3 text-xs text-muted-foreground">
          Sleep and resting heart rate are the stress gauges: short nights and a
          rising resting rate usually come before the cravings do.
        </p>
      </section>

      <Setup open={!health.connected} />
    </>
  );
}

/** Logged through the bot; here to show the pattern, not to judge. */
function Cravings({
  cravings,
}: {
  cravings: { at: Date; level: number | null; note: string | null }[];
}) {
  if (!cravings.length) {
    return (
      <p className="text-sm text-muted-foreground">
        None logged. When one hits, send the bot “craving” (or “craving 4
        work”): it walks you through ten minutes, and the pattern shows up here.
      </p>
    );
  }
  const window = cravingWindow(cravings);
  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">
        {cravings.length} logged
        {window
          ? `, most between ${window}. Plan something for that slot.`
          : "."}
      </p>
      <ul className="divide-y border-y text-sm">
        {cravings.map((c) => (
          <li key={c.at.toISOString()} className="flex gap-4 py-2">
            <span className="w-28 shrink-0 text-muted-foreground tabular-nums">
              {cravingTime.format(c.at)}
            </span>
            <span className="w-10 shrink-0 tabular-nums">
              {c.level ? `${c.level}/5` : "—"}
            </span>
            <span className="min-w-0 truncate">{c.note ?? ""}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

const cravingTime = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

const HABITS: {
  label: string;
  done: (d: HealthRow) => boolean;
  show: (d: HealthRow) => string | null;
}[] = [
  {
    label: `${number(PLAN.steps)} steps`,
    done: (d) => (d.steps ?? 0) >= PLAN.steps,
    show: (d) => (d.steps === null ? null : `${(d.steps / 1000).toFixed(1)}k`),
  },
  {
    label: "Protein each meal",
    done: (d) => d.proteinMeals === PLAN.proteinMeals,
    show: (d) =>
      d.proteinMeals === null ? null : `${d.proteinMeals}/${PLAN.proteinMeals}`,
  },
  {
    label: `Kitchen closed at ${PLAN.kitchenCloses}`,
    done: (d) => d.kitchenClosed === true,
    show: () => null,
  },
  {
    label: "Moved on purpose",
    done: (d) => d.workedOut === true,
    show: () => null,
  },
];

/** Ticks, not scores: a met habit is a mark, anything else stays quiet. */
function WeekGrid({ week, today }: { week: HealthRow[]; today: string }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[34rem] text-sm">
        <thead>
          <tr className="border-b">
            <th scope="col" className="py-2 pr-4 text-left font-medium">
              <span className="sr-only">Habit</span>
            </th>
            {week.map((d) => (
              <th
                key={d.date}
                scope="col"
                className={cn(
                  "w-14 py-2 text-center text-xs font-normal",
                  d.date === today ? "text-ink" : "text-muted-foreground",
                )}
              >
                {editableDay(d.date, today) ? (
                  <Link
                    href={
                      d.date === today ? "/health" : `/health?day=${d.date}`
                    }
                    className="underline-offset-4 hover:underline"
                  >
                    {weekday(d.date)}
                  </Link>
                ) : (
                  weekday(d.date)
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {HABITS.map((habit) => (
            <tr key={habit.label}>
              <th scope="row" className="py-2.5 pr-4 text-left font-normal">
                {habit.label}
              </th>
              {week.map((d) => {
                const future = d.date > today;
                const done = !future && habit.done(d);
                const value = future ? null : habit.show(d);
                return (
                  <td key={d.date} className="py-2.5 text-center">
                    {done ? (
                      <>
                        <Check
                          aria-hidden="true"
                          className="mx-auto size-4 text-ink"
                        />
                        <span className="sr-only">Done</span>
                      </>
                    ) : value ? (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {value}
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="text-muted-foreground/40"
                      >
                        ·
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** How to send Apple Health (and Garmin, through it) here. Open until data arrives. */
function Setup({ open }: { open: boolean }) {
  return (
    <details open={open} className="mt-12 rounded-lg border px-5 py-4">
      <summary className="cursor-pointer font-medium">
        Connect Apple Health
      </summary>
      <div className="mt-4 max-w-2xl space-y-4 text-sm">
        <p className="text-muted-foreground">
          A Shortcut on your iPhone sends the day's readings here each evening.
          Garmin syncs into Apple Health, so it comes along.
        </p>
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            <span className="font-medium">A secret.</span> Run{" "}
            <code className="rounded bg-muted px-1 font-mono text-xs">
              openssl rand -hex 32
            </code>
            , add it in Vercel as{" "}
            <code className="rounded bg-muted px-1 font-mono text-xs">
              HEALTH_INGEST_SECRET
            </code>{" "}
            (production) and redeploy. Keep it for step 4.
          </li>
          <li>
            <span className="font-medium">Garmin.</span> Garmin Connect →
            Settings → Connected Apps → Apple Health: allow steps, sleep,
            resting heart rate and weight.
          </li>
          <li>
            <span className="font-medium">An automation.</span> Shortcuts →
            Automation → New → Time of Day, 21:30, Daily, Run Immediately.
          </li>
          <li>
            <span className="font-medium">Its actions</span>, in order:
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
              <li>
                Find Health Samples: Steps, Start Date is Today, Source is
                Garmin Connect (so the phone's own steps aren't counted twice).
                Then Calculate Statistics: Sum.
              </li>
              <li>
                Find Health Samples: Weight, Start Date is Today, sorted by
                Start Date, latest first, limit 1.
              </li>
              <li>
                Find Health Samples: Resting Heart Rate, Start Date is Today,
                limit 1.
              </li>
              <li>
                Optional, sleep: Find Health Samples: Sleep Analysis, Start Date
                is in the last 1 day, Value is not In Bed or Awake. Get Details
                of Health Samples: Duration, Calculate Statistics: Sum, Convert
                Measurement to hours.
              </li>
              <li>
                Get Contents of URL:{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs break-all">
                  https://admin.dainemawer.com/api/webhooks/health
                </code>
                , Method POST, Header{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">
                  Authorization
                </code>{" "}
                ={" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">
                  Bearer
                </code>{" "}
                then the secret, Request Body JSON:{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">
                  steps
                </code>
                ,{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">
                  weightKg
                </code>
                ,{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">
                  restingHeartRate
                </code>{" "}
                and{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">
                  sleepHours
                </code>
                , each the result above it (for samples, their Value).
              </li>
            </ul>
          </li>
          <li>
            <span className="font-medium">Try it.</span> Run the automation once
            by hand; today's row below should fill in. Missing readings are
            fine: each send only overwrites what it carries.
          </li>
        </ol>
      </div>
    </details>
  );
}

function Stats({ children }: { children: React.ReactNode }) {
  return (
    <dl className="mb-12 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
      {children}
    </dl>
  );
}

function Columns({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-12 xl:grid-cols-[minmax(0,1fr)_20rem]">
      {children}
    </div>
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

const weekdayFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  timeZone: "UTC",
});
function weekday(date: string) {
  return weekdayFormat.format(new Date(`${date}T00:00:00Z`));
}

function number(n: number) {
  return new Intl.NumberFormat("en-GB").format(n);
}

function hours(minutes: number) {
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} m`;
}
