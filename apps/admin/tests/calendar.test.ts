import assert from "node:assert/strict";
import { test } from "node:test";
import { type AgendaEvent, agendaNow, untilLabel } from "../lib/agenda.ts";
import { agendaFromIcs, ownerOf, wallToUtc } from "../lib/calendar.ts";

const ME = "me@example.com";

function ics(...events: string[]): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "X-WR-TIMEZONE:Africa/Johannesburg",
    ...events.map((e) => `BEGIN:VEVENT\n${e.trim()}\nEND:VEVENT`),
    "END:VCALENDAR",
  ].join("\n");
}

// Thursday 29 and Friday 30 October 2026, Cape Town.
const window = {
  from: new Date("2026-10-29T00:00:00+02:00"),
  to: new Date("2026-10-31T00:00:00+02:00"),
};

const feed = ics(
  // Weekly on Thursdays in London (GMT after 25 Oct): 09:00 London = 11:00 Cape Town.
  `UID:weekly
DTSTART;TZID=Europe/London:20260903T090000
DTEND;TZID=Europe/London:20260903T093000
RRULE:FREQ=WEEKLY;BYDAY=TH
SUMMARY:Weekly sync`,
  // Daily standup, with Friday's moved to 10:00 and an EXDATE in the past.
  `UID:daily
DTSTART;TZID=Africa/Johannesburg:20260101T090000
DTEND;TZID=Africa/Johannesburg:20260101T091500
RRULE:FREQ=DAILY
EXDATE;TZID=Africa/Johannesburg:20260105T090000
SUMMARY:Standup
X-GOOGLE-CONFERENCE:https://meet.google.com/abc-defg-hij`,
  `UID:daily
RECURRENCE-ID;TZID=Africa/Johannesburg:20261030T090000
DTSTART;TZID=Africa/Johannesburg:20261030T100000
DTEND;TZID=Africa/Johannesburg:20261030T101500
SUMMARY:Standup (moved)`,
  // A one-off in UTC, one cancelled, one declined, one free.
  `UID:one-off
DTSTART:20261029T130000Z
DTEND:20261029T140000Z
SUMMARY:Client call
LOCATION:https://us02web.zoom.us/j/123456?pwd=x`,
  `UID:cancelled
DTSTART:20261029T150000Z
DTEND:20261029T160000Z
STATUS:CANCELLED
SUMMARY:Cancelled`,
  `UID:declined
DTSTART:20261029T150000Z
DTEND:20261029T160000Z
ATTENDEE;PARTSTAT=DECLINED:mailto:ME@example.com
SUMMARY:Declined`,
  `UID:free
DTSTART:20261030T120000Z
DTEND:20261030T130000Z
TRANSP:TRANSPARENT
SUMMARY:Lunch`,
  // All day on Friday; and one outside the window.
  `UID:holiday
DTSTART;VALUE=DATE:20261030
DTEND;VALUE=DATE:20261031
SUMMARY:Day off`,
  `UID:later
DTSTART:20261102T080000Z
DTEND:20261102T090000Z
SUMMARY:Next week`,
  // A weekly occurrence from last week, moved into this window.
  `UID:moved-in
DTSTART;TZID=Africa/Johannesburg:20260101T160000
DTEND;TZID=Africa/Johannesburg:20260101T170000
RRULE:FREQ=WEEKLY;BYDAY=TH;UNTIL=20261023T000000Z
SUMMARY:Retro`,
  `UID:moved-in
RECURRENCE-ID;TZID=Africa/Johannesburg:20261022T160000
DTSTART;TZID=Africa/Johannesburg:20261030T160000
DTEND;TZID=Africa/Johannesburg:20261030T170000
SUMMARY:Retro (rescheduled)`,
);

test("agendaFromIcs expands, converts zones, and filters", () => {
  const events = agendaFromIcs(feed, "work", window, ME);
  const rows = events.map((e) => [e.title, e.start, e.allDay]);
  assert.deepEqual(rows, [
    ["Standup", "2026-10-29T07:00:00.000Z", false],
    ["Weekly sync", "2026-10-29T09:00:00.000Z", false],
    ["Client call", "2026-10-29T13:00:00.000Z", false],
    ["Day off", "2026-10-29T22:00:00.000Z", true],
    ["Standup (moved)", "2026-10-30T08:00:00.000Z", false],
    ["Lunch", "2026-10-30T12:00:00.000Z", false],
    ["Retro (rescheduled)", "2026-10-30T14:00:00.000Z", false],
  ]);
  const byTitle = Object.fromEntries(events.map((e) => [e.title, e]));
  assert.equal(byTitle.Standup.joinUrl, "https://meet.google.com/abc-defg-hij");
  assert.equal(
    byTitle["Client call"].joinUrl,
    "https://us02web.zoom.us/j/123456?pwd=x",
  );
  assert.equal(byTitle.Lunch.busy, false);
  assert.equal(byTitle["Day off"].end, "2026-10-30T22:00:00.000Z");
  // Declined events stay when the owner isn't known.
  assert.ok(
    agendaFromIcs(feed, "work", window).some((e) => e.title === "Declined"),
  );
});

test("wallToUtc handles DST on both sides of the change", () => {
  assert.equal(
    wallToUtc(2026, 10, 24, 9, 0, 0, "Europe/London").toISOString(),
    "2026-10-24T08:00:00.000Z",
  );
  assert.equal(
    wallToUtc(2026, 10, 26, 9, 0, 0, "Europe/London").toISOString(),
    "2026-10-26T09:00:00.000Z",
  );
  assert.equal(
    wallToUtc(2026, 7, 1, 9, 0, 0, "America/New_York").toISOString(),
    "2026-07-01T13:00:00.000Z",
  );
});

test("ownerOf reads the address out of a Google feed URL", () => {
  assert.equal(
    ownerOf(
      "https://calendar.google.com/calendar/ical/daine.mawer%40example.com/private-abc/basic.ics",
    ),
    "daine.mawer@example.com",
  );
  assert.equal(ownerOf("https://example.com/feed.ics"), null);
});

test("agendaNow finds now, next and the free time left", () => {
  const event = (
    title: string,
    start: string,
    end: string,
    busy = true,
  ): AgendaEvent => ({
    id: title,
    source: "work",
    title,
    start,
    end,
    allDay: false,
    location: null,
    joinUrl: null,
    busy,
  });
  const events = [
    event("A", "2026-10-29T09:00:00+02:00", "2026-10-29T10:00:00+02:00"),
    event("B", "2026-10-29T09:30:00+02:00", "2026-10-29T11:00:00+02:00"),
    event(
      "Free",
      "2026-10-29T12:00:00+02:00",
      "2026-10-29T13:00:00+02:00",
      false,
    ),
    event("C", "2026-10-29T17:00:00+02:00", "2026-10-29T19:00:00+02:00"),
  ];
  const at = agendaNow(events, new Date("2026-10-29T09:45:00+02:00"));
  assert.deepEqual(
    at.current.map((e) => e.title),
    ["A", "B"],
  );
  assert.equal(at.next?.title, "Free");
  assert.equal(at.nextIn, 135);
  // 09:45–18:00 is 495 min; busy 09:45–11:00 (75) and 17:00–18:00 (60).
  assert.equal(at.freeMinutes, 360);
  assert.equal(
    agendaNow(events, new Date("2026-10-29T20:00:00+02:00")).freeMinutes,
    0,
  );
  assert.equal(untilLabel(135), "in 2 h 15 min");
  assert.equal(untilLabel(12), "in 12 min");
});
