// Health: a slow, sustainable cut (88 → 85 kg at 0.5 kg a week) tracked
// without counting calories. Days come in from an Apple Health Shortcut
// (app/api/webhooks/health) and from ticks; this file is the pure part
// (parsing, the weight trend, the plan line), so the tests can import it.

import { z } from "zod";
import { addDays } from "@/lib/documents";

/** The plan. Weights in kg; the start weight is the trend on `start`. */
export const PLAN = {
  start: "2026-11-02",
  /** Roughly where it starts, for the copy; the chart uses the real trend. */
  fromKg: 88,
  goalKg: 85,
  kgPerWeek: 0.5,
  /** Daily targets, ticked rather than scored. */
  steps: 8000,
  proteinMeals: 3,
  kitchenCloses: "20:00",
  /** HIIT, bodyweight or a run; ten minutes counts. */
  workoutsPerWeek: 3,
} as const;

/**
 * A number from a Shortcut: a JSON number, or text in any locale ("88,2"
 * on a South African phone, "8 412" or "8,412" steps). Null when absent
 * or unreadable.
 */
export function parseNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  let text = value.replace(/[\s  ]/g, "").replace(/[^\d.,-]/g, "");
  if (!text) return null;
  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    // Both: whichever comes last is the decimal point.
    text =
      lastComma > lastDot
        ? text.replace(/\./g, "").replace(",", ".")
        : text.replace(/,/g, "");
  } else if (lastComma > -1) {
    // Only commas: "88,2" is a decimal, "8,412" groups thousands.
    const decimals = text.length - lastComma - 1;
    text =
      decimals === 3 && text.indexOf(",") === lastComma
        ? text.replace(",", "")
        : text.replace(/,/g, ".");
  }
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

const reading = (min: number, max: number) =>
  z
    .unknown()
    .transform(parseNumber)
    .refine((n) => n === null || (n >= min && n <= max), {
      message: `Expected ${min}–${max}.`,
    })
    .optional();

/** One day as the Shortcut sends it. Every reading is optional. */
export const healthDaySchema = z.object({
  date: z.iso.date().optional(),
  weightKg: reading(30, 250),
  steps: reading(0, 150_000),
  sleepHours: reading(0, 24),
  restingHeartRate: reading(20, 200),
});

/** `{ days: [...] }` to backfill, or one day's fields on their own. */
export const healthPayloadSchema = z.preprocess(
  (body) =>
    body && typeof body === "object" && "days" in body
      ? body
      : { days: [body] },
  z.object({ days: z.array(healthDaySchema).min(1).max(400) }),
);

export type HealthReadings = {
  weightGrams: number | null;
  steps: number | null;
  sleepMinutes: number | null;
  restingHr: number | null;
};

/** What's stored: grams and whole minutes, like money in minor units. */
export function toReadings(day: z.output<typeof healthDaySchema>) {
  const round = (n: number | null | undefined, scale = 1) =>
    n == null ? null : Math.round(n * scale);
  return {
    weightGrams: round(day.weightKg, 1000),
    steps: round(day.steps),
    sleepMinutes: round(day.sleepHours, 60),
    restingHr: round(day.restingHeartRate),
  } satisfies HealthReadings;
}

/* ---------- The trend ---------- */

/**
 * How much of each new weigh-in moves the trend (the Hacker's Diet uses
 * 0.1). The scale swings a kilo or two with water and salt; the trend
 * moves about as much in a fortnight as the fat underneath.
 */
const SMOOTHING = 0.1;

export type TrendPoint = { date: string; kg: number | null; trend: number };

/**
 * A smoothed weight for every day from the first weigh-in to `until`.
 * Days without a weigh-in keep the trend where it was.
 */
export function weightTrend(
  weighIns: { date: string; kg: number }[],
  until: string,
): TrendPoint[] {
  const sorted = [...weighIns].sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length) return [];
  const byDate = new Map(sorted.map((w) => [w.date, w.kg]));
  const points: TrendPoint[] = [];
  let trend = sorted[0].kg;
  for (let date = sorted[0].date; date <= until; date = addDays(date, 1)) {
    const kg = byDate.get(date) ?? null;
    if (kg !== null) trend += SMOOTHING * (kg - trend);
    points.push({ date, kg, trend });
  }
  return points;
}

/** Trend change over the last week, in kg (negative is losing). */
export function weeklyChange(points: TrendPoint[]): number | null {
  if (points.length < 8) return null;
  return points[points.length - 1].trend - points[points.length - 8].trend;
}

/** The plan's target on a date: a straight line from the start weight down to the goal. */
export function planTarget(startKg: number, date: string): number {
  const weeks = Math.max(0, daysBetween(PLAN.start, date)) / 7;
  return Math.max(PLAN.goalKg, startKg - weeks * PLAN.kgPerWeek);
}

/** When the plan reaches the goal from a start weight. */
export function planGoalDate(startKg: number): string {
  const weeks = Math.max(0, startKg - PLAN.goalKg) / PLAN.kgPerWeek;
  return addDays(PLAN.start, Math.ceil(weeks * 7));
}

/**
 * When the goal is reached at the current pace, or null while the trend
 * isn't going down. Capped at a year: further out isn't a date, it's "not
 * at this rate".
 */
export function projectedGoalDate(
  today: string,
  trendKg: number,
  kgPerWeek: number | null,
): string | null {
  if (trendKg <= PLAN.goalKg) return today;
  if (kgPerWeek === null || kgPerWeek >= 0) return null;
  const days = Math.ceil(((trendKg - PLAN.goalKg) / -kgPerWeek) * 7);
  return days > 365 ? null : addDays(today, days);
}

export function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 864e5,
  );
}

/* ---------- The page's numbers ---------- */

export type HealthRow = {
  date: string;
  weightGrams: number | null;
  steps: number | null;
  sleepMinutes: number | null;
  restingHr: number | null;
  proteinMeals: number | null;
  kitchenClosed: boolean | null;
  workedOut: boolean | null;
};

/** Monday to Sunday of the week `date` is in. */
export function weekOf(date: string): string[] {
  const weekday = (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
  const monday = addDays(date, -weekday);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** An empty day: nothing measured, nothing ticked. */
export const emptyDay = (date: string): HealthRow => ({
  date,
  weightGrams: null,
  steps: null,
  sleepMinutes: null,
  restingHr: null,
  proteinMeals: null,
  kitchenClosed: null,
  workedOut: null,
});

/**
 * The weight the plan line starts from: the trend on the plan's first day;
 * the first weigh-in, if that came later; or, before the plan starts, the
 * trend today. `points` has one per day, so the first case is a lookup.
 */
export function planStartKg(points: TrendPoint[]): number | null {
  const first = points[0];
  const latest = points.at(-1);
  if (!first || !latest) return null;
  if (latest.date < PLAN.start) return latest.trend;
  if (first.date > PLAN.start) return first.trend;
  return points.find((p) => p.date === PLAN.start)?.trend ?? null;
}

/** Everything /health and the dashboard tile show, from all stored days. */
export function summarise(rows: HealthRow[], today: string) {
  const byDate = new Map(rows.map((row) => [row.date, row]));
  const day = (date: string) => byDate.get(date) ?? emptyDay(date);
  const points = weightTrend(
    rows
      .filter((row) => row.weightGrams !== null && row.date <= today)
      .map((row) => ({ date: row.date, kg: kg(row.weightGrams) as number })),
    today,
  );
  const latest = points.at(-1) ?? null;
  const startKg = planStartKg(points);
  const weekly = weeklyChange(points);
  const week = weekOf(today).map(day);
  return {
    today: day(today),
    points,
    trendKg: latest?.trend ?? null,
    scaleKg: kg(day(today).weightGrams),
    weeklyKg: weekly,
    startKg,
    targetKg: startKg === null ? null : planTarget(startKg, today),
    planGoal: startKg === null ? null : planGoalDate(startKg),
    projectedGoal:
      latest === null ? null : projectedGoalDate(today, latest.trend, weekly),
    week,
    workoutsThisWeek: week.filter((d) => d.workedOut).length,
    recent: Array.from({ length: 14 }, (_, i) => day(addDays(today, -i))),
    /** Anything from the Shortcut yet (it sends steps, sleep or heart rate). */
    connected: rows.some(
      (row) =>
        row.steps !== null ||
        row.sleepMinutes !== null ||
        row.restingHr !== null,
    ),
  };
}

export type HealthSummary = ReturnType<typeof summarise>;

export const kg = (grams: number | null) =>
  grams === null ? null : grams / 1000;

/** `87.64` → `87.6 kg`; a change gets its sign: `−0.4 kg`. */
export function formatKg(value: number, { signed = false } = {}) {
  const text = Math.abs(value).toFixed(1);
  const sign = signed && text !== "0.0" ? (value < 0 ? "−" : "+") : "";
  return `${value < 0 && !signed ? "-" : sign}${text} kg`;
}

/** Ticks and weigh-ins can be filled in for today and the six days before. */
export function editableDay(date: string, today: string): boolean {
  const days = daysBetween(date, today);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && days >= 0 && days < 7;
}
