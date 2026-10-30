import "server-only";
import { asc, gte, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/db";
import { healthCravings, healthDays } from "@/db/schema";
import { TAG } from "@/lib/cache-tags";
import { wallToUtc } from "@/lib/calendar";
import { TIME_ZONE, todayISO } from "@/lib/documents";
import { PLAN, summarise, weekOf } from "@/lib/health";
import {
  cravingHour,
  cravingReply,
  type HealthMessage,
  weightReply,
} from "@/lib/health-messages";

// Health logs sent to the Telegram bot, and the numbers the scheduled
// messages need. Only reachable from the Telegram webhook (secret + your
// chat ID) and the cron route (CRON_SECRET), so it reads the tables
// directly instead of through the session-gated lib/health-data.ts.

/** Saves what the message says and returns the bot's reply. */
export async function logHealthMessage(
  message: HealthMessage,
): Promise<string> {
  const today = todayISO();
  switch (message.kind) {
    case "weight": {
      await saveDay(today, { weightGrams: Math.round(message.kg * 1000) });
      return weightReply(message.kg, await currentHealth());
    }
    case "craving": {
      const week = await cravingsThisWeek();
      await db
        .insert(healthCravings)
        .values({ level: message.level, note: message.note });
      revalidateTag(TAG.health, { expire: 0 });
      const hour = cravingHour(new Date());
      return cravingReply(
        week.filter((c) => Math.abs(cravingHour(c.at) - hour) <= 1).length,
      );
    }
    case "protein":
      await saveDay(today, { proteinMeals: message.meals });
      return `Protein ${message.meals}/3 today.`;
    case "kitchen":
      await saveDay(today, { kitchenClosed: true });
      return "Kitchen closed. Nice one.";
    case "moved": {
      await saveDay(today, { workedOut: true });
      const { workoutsThisWeek } = await currentHealth();
      return `Logged. ${workoutsThisWeek} of ${PLAN.workoutsPerWeek} workouts this week.`;
    }
  }
}

/** Every stored day, summarised as of today (uncached: it follows a write). */
export async function currentHealth() {
  const rows = await db
    .select({
      date: healthDays.date,
      weightGrams: healthDays.weightGrams,
      steps: healthDays.steps,
      sleepMinutes: healthDays.sleepMinutes,
      restingHr: healthDays.restingHr,
      proteinMeals: healthDays.proteinMeals,
      kitchenClosed: healthDays.kitchenClosed,
      workedOut: healthDays.workedOut,
    })
    .from(healthDays)
    .orderBy(asc(healthDays.date));
  return summarise(rows, todayISO());
}

/** Cravings since Monday, Cape Town time. */
export async function cravingsThisWeek() {
  const [monday] = weekOf(todayISO());
  const [y, m, d] = monday.split("-").map(Number);
  return db
    .select({
      at: healthCravings.at,
      level: healthCravings.level,
      note: healthCravings.note,
    })
    .from(healthCravings)
    .where(gte(healthCravings.at, wallToUtc(y, m, d, 0, 0, 0, TIME_ZONE)))
    .orderBy(asc(healthCravings.at));
}

async function saveDay(
  date: string,
  values: Partial<typeof healthDays.$inferInsert>,
) {
  await db
    .insert(healthDays)
    .values({ date, ...values })
    .onConflictDoUpdate({
      target: healthDays.date,
      set: { ...values, updatedAt: sql`now()` },
    });
  revalidateTag(TAG.health, { expire: 0 });
}
