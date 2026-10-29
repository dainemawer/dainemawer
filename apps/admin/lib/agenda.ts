// The HUD agenda's shape and the live bits worked out in the browser each
// minute: what's on now, what's next, and how much of the working day is
// still free. Pure and client-safe (no ical.js), so the tests and the
// client component can import it.

import { TIME_ZONE, todayISO } from "@/lib/documents";

export const CALENDAR_SOURCES = ["work", "personal"] as const;
export type CalendarSource = (typeof CALENDAR_SOURCES)[number];

export const SOURCE_LABEL: Record<CalendarSource, string> = {
  work: "Work",
  personal: "Personal",
};

export type AgendaEvent = {
  id: string;
  source: CalendarSource;
  title: string;
  /** ISO instants. All-day events run midnight to midnight, Cape Town. */
  start: string;
  end: string;
  allDay: boolean;
  location: string | null;
  /** Meet, Zoom or Teams link, when there is one. */
  joinUrl: string | null;
  /** False for events marked "free" (they don't use up free time). */
  busy: boolean;
};

/** The working day free time is counted in, Cape Town hours. */
export const WORKDAY = { start: 8, end: 18 } as const;

export function dayOf(iso: string): string {
  return todayISO(new Date(iso));
}

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** `14:30`, Cape Town time. */
export function clockTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

/** `in 12 min`, `in 2 h 5 min`. */
export function untilLabel(minutes: number): string {
  if (minutes < 1) return "now";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (!h) return `in ${m} min`;
  return m ? `in ${h} h ${m} min` : `in ${h} h`;
}

/** `2 h 30 min`. */
export function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export type AgendaNow = {
  /** Timed events under way. */
  current: AgendaEvent[];
  /** The next timed event to start today or tomorrow. */
  next: AgendaEvent | null;
  /** Minutes until `next` starts. */
  nextIn: number | null;
  /** Unbooked minutes left in today's working day. */
  freeMinutes: number;
};

export function agendaNow(events: AgendaEvent[], now: Date): AgendaNow {
  const t = now.getTime();
  const timed = events.filter((e) => !e.allDay);
  const current = timed.filter(
    (e) => Date.parse(e.start) <= t && Date.parse(e.end) > t,
  );
  const next = timed.find((e) => Date.parse(e.start) > t) ?? null;

  // Today's working day, as instants: Cape Town is UTC+2 all year.
  const today = todayISO(now);
  const dayStart = Date.parse(`${today}T${pad(WORKDAY.start)}:00:00+02:00`);
  const dayEnd = Date.parse(`${today}T${pad(WORKDAY.end)}:00:00+02:00`);
  const from = Math.max(t, dayStart);
  let free = Math.max(0, dayEnd - from);
  // Subtract the union of busy time, so overlapping meetings count once.
  let covered = from;
  for (const e of timed
    .filter((e) => e.busy)
    .map((e) => [Date.parse(e.start), Date.parse(e.end)] as const)
    .sort((a, b) => a[0] - b[0])) {
    const start = Math.max(e[0], covered);
    const end = Math.min(e[1], dayEnd);
    if (end > start) {
      free -= end - start;
      covered = end;
    }
  }
  return {
    current,
    next,
    nextIn: next ? (Date.parse(next.start) - t) / 60_000 : null,
    freeMinutes: Math.max(0, Math.floor(free / 60_000)),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");
