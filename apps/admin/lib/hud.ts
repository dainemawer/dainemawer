// The dashboard HUD's clock: what to show for an instant, on Cape Town time
// (the business's time zone, so it reads the same when travelling). Pure,
// so the tests can import it.

import { TIME_ZONE } from "@/lib/documents";

export type ClockFace = {
  weekday: string;
  /** `28 October 2026` */
  date: string;
  /** `14:32` */
  time: string;
  /** `07` */
  seconds: string;
  dayOfYear: number;
  daysInYear: number;
  /** ISO 8601 week number. */
  week: number;
  /** How much of the year has passed, 0–1, to the minute. */
  yearProgress: number;
};

const partsFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function clockFace(now: Date): ClockFace {
  const parts = Object.fromEntries(
    partsFormat.formatToParts(now).map((p) => [p.type, p.value]),
  );
  const year = Number(parts.year);
  // The local calendar date, as a UTC midnight, to count whole days.
  const local = Date.UTC(year, monthIndex(now), Number(parts.day));
  const dayOfYear = Math.round((local - Date.UTC(year, 0, 1)) / 864e5) + 1;
  const daysInYear = isLeap(year) ? 366 : 365;
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  return {
    weekday: parts.weekday,
    date: `${parts.day} ${parts.month} ${year}`,
    time: `${parts.hour}:${parts.minute}`,
    seconds: parts.second,
    dayOfYear,
    daysInYear,
    week: isoWeek(local),
    yearProgress: (dayOfYear - 1 + minutes / 1440) / daysInYear,
  };
}

const monthFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  month: "numeric",
});

function monthIndex(now: Date): number {
  return Number(monthFormat.format(now)) - 1;
}

function isLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** ISO week of a date given as UTC midnight: weeks start Monday, and week 1 holds the year's first Thursday. */
export function isoWeek(utcMidnight: number): number {
  const date = new Date(utcMidnight);
  const weekday = date.getUTCDay() || 7;
  // The Thursday of this week decides which year the week belongs to.
  date.setUTCDate(date.getUTCDate() + 4 - weekday);
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
  return Math.ceil(((date.getTime() - yearStart) / 864e5 + 1) / 7);
}
