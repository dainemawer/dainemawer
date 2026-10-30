// Health: a slow, sustainable cut (88 → 85 kg at 0.5 kg a week) tracked
// without counting calories. Days come in from an Apple Health Shortcut
// (app/api/webhooks/health) and from ticks; this file is the pure part
// (parsing, the weight trend, the plan line), so the tests can import it.

import { z } from "zod";
import { addDays } from "@/lib/documents";

/** The plan. Weights in kg; the start weight is the trend on `start`. */
export const PLAN = {
  start: "2026-11-02",
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
  const weeks = daysBetween(PLAN.start, date) / 7;
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
