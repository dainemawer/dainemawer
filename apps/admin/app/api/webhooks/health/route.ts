import { timingSafeEqual } from "node:crypto";
import { sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/db";
import { healthDays } from "@/db/schema";
import { TAG } from "@/lib/cache-tags";
import { todayISO } from "@/lib/documents";
import {
  type HealthReadings,
  healthPayloadSchema,
  toReadings,
} from "@/lib/health";

// The Apple Health Shortcut posts here once a day (Garmin syncs into Apple
// Health, so its steps and sleep arrive the same way). Authorised by
// HEALTH_INGEST_SECRET as a bearer token; without the secret configured
// every request is refused. A day can be sent any number of times: each
// send overwrites only the readings it carries, so steps can grow through
// the day and a missing reading never erases one already there.
//
// Body: { date?, weightKg?, steps?, sleepHours?, restingHeartRate? }, or
// { days: [...] } to backfill. Numbers may be text in any locale ("88,2").

export async function POST(request: Request) {
  if (!authorised(request.headers.get("authorization"))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const parsed = healthPayloadSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      {
        error: parsed.error.issues.map(
          (i) => `${i.path.join(".")}: ${i.message}`,
        ),
      },
      { status: 400 },
    );
  }

  const today = todayISO();
  // One row per date (Postgres won't upsert the same key twice in one
  // statement); a later entry's readings win over an earlier one's.
  const byDate = new Map<string, HealthReadings & { date: string }>();
  for (const day of parsed.data.days) {
    const date = day.date ?? today;
    if (date > today) continue;
    const readings = toReadings(day);
    const before = byDate.get(date);
    byDate.set(date, {
      date,
      weightGrams: readings.weightGrams ?? before?.weightGrams ?? null,
      steps: readings.steps ?? before?.steps ?? null,
      sleepMinutes: readings.sleepMinutes ?? before?.sleepMinutes ?? null,
      restingHr: readings.restingHr ?? before?.restingHr ?? null,
    });
  }
  const rows = [...byDate.values()].filter(
    (row) =>
      (row.weightGrams ?? row.steps ?? row.sleepMinutes ?? row.restingHr) !==
      null,
  );
  if (!rows.length) {
    return Response.json(
      { error: ["No readings for today or earlier."] },
      { status: 400 },
    );
  }

  const keep = (column: string) =>
    sql.raw(`coalesce(excluded.${column}, health_days.${column})`);
  await db
    .insert(healthDays)
    .values(rows)
    .onConflictDoUpdate({
      target: healthDays.date,
      set: {
        weightGrams: keep("weight_grams"),
        steps: keep("steps"),
        sleepMinutes: keep("sleep_minutes"),
        restingHr: keep("resting_hr"),
        updatedAt: new Date(),
      },
    });
  revalidateTag(TAG.health, { expire: 0 });
  return Response.json({ saved: rows.map((row) => row.date) });
}

function authorised(header: string | null) {
  const secret = process.env.HEALTH_INGEST_SECRET;
  if (!secret || !header) return false;
  const given = Buffer.from(header);
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
