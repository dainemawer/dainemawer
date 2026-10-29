// The dashboard HUD's agenda: reads an iCalendar feed (a Google Calendar
// "secret address") and lists what overlaps a window, recurring events
// expanded. Pure, so the tests can import it; fetching and caching are in
// lib/calendar-feeds.ts.
//
// Two things here are deliberate, both learned on a 17 MB work calendar:
// - ical.js's Event constructor, given no exceptions, relates every
//   RECURRENCE-ID in the whole calendar to each series (no UID check), which
//   ran out of memory. Exceptions are grouped by UID and passed in instead.
// - Times are converted with Intl from the event's wall-clock time and
//   TZID, not with ical.js's VTIMEZONE engine: Google always uses IANA zone
//   names, and it keeps the expansion cheap.

import ICAL from "ical.js";
import type { AgendaEvent, CalendarSource } from "@/lib/agenda";
import { TIME_ZONE } from "@/lib/documents";

// Never loop forever on an odd RRULE: a daily series from 2015 is ~4,000.
const MAX_OCCURRENCES = 20_000;

type Window = { from: Date; to: Date };

export function agendaFromIcs(
  ics: string,
  source: CalendarSource,
  window: Window,
  /** The calendar owner's address, to drop events they declined. */
  me?: string | null,
): AgendaEvent[] {
  const calendar = new ICAL.Component(ICAL.parse(ics));
  const defaultZone =
    String(calendar.getFirstPropertyValue("x-wr-timezone") ?? "") || TIME_ZONE;
  const vevents = calendar.getAllSubcomponents("vevent");

  const exceptionsByUid = new Map<string, ICAL.Event[]>();
  const masters: ICAL.Component[] = [];
  for (const vevent of vevents) {
    if (vevent.hasProperty("recurrence-id")) {
      const uid = String(vevent.getFirstPropertyValue("uid"));
      const list = exceptionsByUid.get(uid) ?? [];
      list.push(new ICAL.Event(vevent, { exceptions: [] }));
      exceptionsByUid.set(uid, list);
    } else {
      masters.push(vevent);
    }
  }

  // Floating bounds a day wider than the window: wall-clock times in other
  // zones can sit up to ~14h either side. The exact cut is in UTC, below.
  const looseFrom = ICAL.Time.fromJSDate(
    new Date(window.from.getTime() - 864e5),
    true,
  );
  const looseTo = ICAL.Time.fromJSDate(
    new Date(window.to.getTime() + 864e5),
    true,
  );
  // The zone comes from the property's TZID when ical.js has no VTIMEZONE
  // for it (it then reads the time as floating).
  const toUtc = (time: ICAL.Time, item: ICAL.Event, property: string) =>
    icalToDate(time, zoneParam(item.component, property) ?? defaultZone);

  const events: AgendaEvent[] = [];
  const add = (
    item: ICAL.Event,
    start: ICAL.Time,
    end: ICAL.Time,
    key: string,
  ) => {
    if (!wanted(item.component, me)) return;
    const allDay = start.isDate;
    const startAt = toUtc(start, item, "dtstart");
    // An event with no end lasts a day (all-day) or no time at all.
    const endAt = end
      ? toUtc(
          end,
          item,
          item.component.hasProperty("dtend") ? "dtend" : "dtstart",
        )
      : new Date(startAt.getTime() + (allDay ? 864e5 : 0));
    if (
      !(
        startAt < window.to &&
        (endAt > window.from || (+endAt === +startAt && startAt >= window.from))
      )
    )
      return;
    events.push({
      id: `${source}:${item.uid}:${key}`,
      source,
      title: String(item.summary ?? "").trim() || "(No title)",
      start: startAt.toISOString(),
      end: endAt.toISOString(),
      allDay,
      location: String(item.location ?? "").trim() || null,
      joinUrl: joinUrl(item.component),
      busy: item.component.getFirstPropertyValue("transp") !== "TRANSPARENT",
    });
  };

  for (const vevent of masters) {
    const uid = String(vevent.getFirstPropertyValue("uid"));
    const event = new ICAL.Event(vevent, {
      exceptions: exceptionsByUid.get(uid) ?? [],
    });
    if (!event.startDate) continue;
    if (!event.isRecurring()) {
      if (
        event.startDate.compare(looseTo) < 0 &&
        (event.endDate ?? event.startDate).compare(looseFrom) >= 0
      ) {
        add(event, event.startDate, event.endDate, "");
      }
      continue;
    }
    const iterator = event.iterator();
    let count = 0;
    for (
      let next = iterator.next();
      next && next.compare(looseTo) < 0 && ++count <= MAX_OCCURRENCES;
      next = iterator.next()
    ) {
      const details = event.getOccurrenceDetails(next);
      if (details.endDate.compare(looseFrom) < 0) continue;
      add(details.item, details.startDate, details.endDate, next.toString());
    }
  }

  // Exceptions moved into the window from a date outside it never come up
  // in their series' iteration (which yields the original date).
  const seen = new Set(events.map((e) => e.id));
  for (const [uid, exceptions] of exceptionsByUid) {
    for (const exception of exceptions) {
      const key = exception.recurrenceId.toString();
      if (seen.has(`${source}:${uid}:${key}`)) continue;
      if (
        exception.startDate.compare(looseTo) >= 0 ||
        exception.endDate.compare(looseFrom) < 0
      )
        continue;
      add(exception, exception.startDate, exception.endDate, key);
    }
  }

  return events.sort(
    (a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end),
  );
}

/** Google's feed URLs carry the calendar's address: `/calendar/ical/<email>/private-…/basic.ics`. */
export function ownerOf(url: string): string | null {
  const match = url.match(/\/calendar\/ical\/([^/]+)\//);
  if (!match) return null;
  const email = decodeURIComponent(match[1]);
  return email.includes("@") ? email : null;
}

/** Not cancelled, and not declined by the owner. */
function wanted(vevent: ICAL.Component, me?: string | null): boolean {
  if (vevent.getFirstPropertyValue("status") === "CANCELLED") return false;
  if (!me) return true;
  const mine = vevent
    .getAllProperties("attendee")
    .find(
      (a) =>
        String(a.getFirstValue()).toLowerCase() ===
        `mailto:${me.toLowerCase()}`,
    );
  return mine?.getParameter("partstat") !== "DECLINED";
}

const JOIN_PATTERN =
  /https:\/\/(?:meet\.google\.com\/[a-z0-9-]+|[\w.-]*zoom\.us\/j\/[^\s<>"]+|teams\.microsoft\.com\/l\/meetup-join\/[^\s<>"]+)/i;

/** The video call link: Google's own field, else the first Meet/Zoom/Teams link in the location or description. */
function joinUrl(vevent: ICAL.Component): string | null {
  const google = String(
    vevent.getFirstPropertyValue("x-google-conference") ?? "",
  );
  if (google.startsWith("https://")) return google;
  for (const name of ["location", "description"]) {
    const match = String(vevent.getFirstPropertyValue(name) ?? "").match(
      JOIN_PATTERN,
    );
    if (match) return match[0];
  }
  return null;
}

function zoneParam(vevent: ICAL.Component, property: string): string | null {
  const tzid = vevent.getFirstProperty(property)?.getParameter("tzid");
  return typeof tzid === "string" && tzid ? tzid : null;
}

function icalToDate(time: ICAL.Time, fallbackZone: string): Date {
  if (time.isDate) {
    // All-day: midnight where the business is, so "today" lines up.
    return wallToUtc(time.year, time.month, time.day, 0, 0, 0, TIME_ZONE);
  }
  const tzid = time.zone?.tzid;
  const zone =
    tzid === "UTC" || tzid === "Z"
      ? "UTC"
      : tzid && tzid !== "floating"
        ? tzid
        : fallbackZone;
  return wallToUtc(
    time.year,
    time.month,
    time.day,
    time.hour,
    time.minute,
    time.second,
    zone,
  );
}

/** A wall-clock time in an IANA zone, as an instant (DST gaps resolve forward). */
export function wallToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  zone: string,
): Date {
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  if (zone === "UTC") return new Date(asUtc);
  let guess = asUtc - offsetMs(asUtc, zone);
  // Once more, in case the guess crossed a DST change.
  guess = asUtc - offsetMs(guess, zone);
  return new Date(guess);
}

const offsetFormats = new Map<string, Intl.DateTimeFormat>();

function offsetMs(instant: number, zone: string): number {
  let format = offsetFormats.get(zone);
  if (!format) {
    try {
      format = new Intl.DateTimeFormat("en-US", {
        timeZone: zone,
        hourCycle: "h23",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
      });
    } catch {
      // An unknown zone name: treat as the business's zone.
      return offsetMs(instant, TIME_ZONE);
    }
    offsetFormats.set(zone, format);
  }
  const p = Object.fromEntries(
    format
      .formatToParts(new Date(instant))
      .map((x) => [x.type, Number(x.value)]),
  );
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return wall - Math.floor(instant / 1000) * 1000;
}
