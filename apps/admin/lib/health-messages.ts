// What you can tell the bot about health, and what it says back. Pure (no
// database, no Telegram), so the tests can import it; lib/health-log.ts
// does the saving and app/api/cron/health the scheduled messages.

import { TIME_ZONE } from "@/lib/documents";
import {
  formatKg,
  type HealthRow,
  type HealthSummary,
  PLAN,
  parseNumber,
} from "@/lib/health";
import type { TelegramMessage } from "@/lib/telegram-format";

export type HealthMessage =
  | { kind: "weight"; kg: number }
  | { kind: "craving"; level: number | null; note: string | null }
  | { kind: "protein"; meals: number }
  | { kind: "kitchen" }
  | { kind: "moved" };

/**
 * A health log, or null for anything else (which goes to the assistant).
 * Only short, exact shapes count, so a question is never mistaken for one:
 * "88.2", "88,2 kg", "craving", "craving 4 work call", "protein 2",
 * "kitchen", "moved".
 */
export function parseHealthMessage(text: string): HealthMessage | null {
  const message = text.trim().toLowerCase().replace(/\s+/g, " ");

  const weight = message.match(
    /^(?:weight |w )?(\d{2,3}(?:[.,]\d{1,2})?) ?(?:kg)?$/,
  );
  if (weight) {
    const kg = parseNumber(weight[1]);
    return kg !== null && kg >= 30 && kg <= 250 ? { kind: "weight", kg } : null;
  }

  const craving = message.match(
    /^(?:craving|cravings|crave)(?: ([1-5])(?:\/5)?)?(?: (.+))?$/,
  );
  if (craving) {
    return {
      kind: "craving",
      level: craving[1] ? Number(craving[1]) : null,
      note: craving[2]?.slice(0, 200) ?? null,
    };
  }

  const protein = message.match(/^protein ([0-3])$/);
  if (protein) return { kind: "protein", meals: Number(protein[1]) };

  if (/^(?:kitchen|kitchen closed|closed)$/.test(message)) {
    return { kind: "kitchen" };
  }
  if (
    /^(?:moved|workout|worked out|hiit|run|ran|trained)(?: \d+ ?(?:min|mins|minutes|m))?$/.test(
      message,
    )
  ) {
    return { kind: "moved" };
  }
  return null;
}

export const HEALTH_HELP =
  "Health: send your weight (88.2), craving (or craving 4 work), protein 2, kitchen, or moved.";

/** The craving routine. Short enough to read while the urge is on. */
export function cravingReply(sameHourThisWeek: number): string {
  return [
    "Logged. Before anything:",
    "1. A big glass of water.",
    "2. Ten minutes away from the kitchen: a walk round the block, or slow breathing (in for 4, out for 8).",
    "3. Still want it after that? Have the planned snack (biltong, yoghurt, fruit), sitting down, and enjoy it. No guilt either way.",
    "Urges usually crest and fade within twenty minutes or so.",
    sameHourThisWeek >= 2
      ? `That's ${sameHourThisWeek + 1} this week around this time. Worth planning something for this slot: a walk, a call, a snack ready in advance.`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** After a weigh-in: the trend, which is the number that matters. */
export function weightReply(kg: number, summary: HealthSummary): string {
  const lines = [`${formatKg(kg)} logged.`];
  if (summary.trendKg !== null) {
    lines.push(
      `Trend ${formatKg(summary.trendKg)}${
        summary.weeklyKg === null
          ? ""
          : `, ${formatKg(summary.weeklyKg, { signed: true })} this week`
      }.`,
    );
    if (kg - summary.trendKg >= 0.8) {
      lines.push(
        "The scale's up more than the trend: that's water and salt, not fat. Carry on.",
      );
    }
  }
  return lines.join(" ");
}

/** The hour (0–23) a craving happened, in Cape Town. */
export function cravingHour(at: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: TIME_ZONE,
    }).format(at),
  );
}

type Craving = { at: Date; level: number | null; note: string | null };

/** The two-hour window with the most cravings, if any repeats. */
export function cravingWindow(cravings: Craving[]): string | null {
  const counts = new Map<number, number>();
  for (const craving of cravings) {
    const start = Math.floor(cravingHour(craving.at) / 2) * 2;
    counts.set(start, (counts.get(start) ?? 0) + 1);
  }
  const [start, count] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? [];
  if (start === undefined || (count ?? 0) < 2) return null;
  const hh = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;
  return `${hh(start)}–${hh(start + 2)}`;
}

const HABIT_TIPS: Record<string, string> = {
  steps:
    "Steps were the gap. Put a 15-minute walk straight after lunch on the calendar, like a meeting.",
  protein:
    "Protein was the gap. Make breakfast the easy win: eggs, yoghurt or a shake, every day.",
  kitchen:
    "The kitchen stayed open late. Brush your teeth at 20:00: it's a surprisingly good off switch.",
  moved:
    "Fewer workouts than planned. Lower the bar: one 10-minute bodyweight circuit counts, so do that.",
};

/** Sunday's review: how the week went, and one thing to change. */
export function weeklyReview(
  summary: HealthSummary,
  cravings: Craving[],
): TelegramMessage {
  const days = summary.week.filter((d) => d.date <= summary.today.date);
  const count = (done: (d: HealthRow) => boolean) => days.filter(done).length;
  const habits = {
    steps: count((d) => (d.steps ?? 0) >= PLAN.steps),
    protein: count((d) => d.proteinMeals === PLAN.proteinMeals),
    kitchen: count((d) => d.kitchenClosed === true),
    moved: summary.workoutsThisWeek,
  };
  const of = days.length;
  const window = cravingWindow(cravings);

  let tip: string;
  if (summary.weeklyKg !== null && summary.weeklyKg < -1) {
    tip =
      "You're losing faster than planned. Eat a little more: a gentler pace is the one you keep.";
  } else {
    // The habit furthest below its target, as a share of it.
    const shortfalls: [string, number][] = [
      ["steps", habits.steps / of],
      ["protein", habits.protein / of],
      ["kitchen", habits.kitchen / of],
      ["moved", habits.moved / PLAN.workoutsPerWeek],
    ];
    const [weakest, share] = shortfalls.sort((a, b) => a[1] - b[1])[0];
    tip =
      share >= 0.85
        ? "Every habit held this week. Same again: that's the whole plan."
        : HABIT_TIPS[weakest];
  }

  return {
    title: "Your week",
    lines: [
      summary.trendKg === null
        ? "No weigh-ins this week. Even three mornings make the trend useful."
        : `Trend ${formatKg(summary.trendKg)}${
            summary.weeklyKg === null
              ? ""
              : `, ${formatKg(summary.weeklyKg, { signed: true })} on the week (plan −${PLAN.kgPerWeek} kg)`
          }.`,
      `Steps ${habits.steps}/${of} · protein ${habits.protein}/${of} · kitchen ${habits.kitchen}/${of} · moved ${habits.moved}/${PLAN.workoutsPerWeek}`,
      cravings.length
        ? `${cravings.length} craving${cravings.length === 1 ? "" : "s"} logged${
            window ? `, most between ${window}` : ""
          }.`
        : "No cravings logged.",
      tip,
    ],
  };
}
