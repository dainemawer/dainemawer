import "server-only";
import { cacheLife } from "next/cache";
import {
  type AgendaEvent,
  CALENDAR_SOURCES,
  type CalendarSource,
} from "@/lib/agenda";
import { agendaFromIcs, ownerOf } from "@/lib/calendar";
import { requireSession } from "@/lib/session";
import { getToday } from "@/lib/today";

// The HUD's calendars: each is a Google Calendar "secret address in iCal
// format", kept in an env var because the URL itself is the credential.
// Feeds are big (years of history), so each is fetched and reduced to
// today and tomorrow inside a shared runtime cache entry; only that short
// list is stored.

const ENV: Record<CalendarSource, string> = {
  work: "CALENDAR_WORK_URL",
  personal: "CALENDAR_PERSONAL_URL",
};

export type Agenda = {
  /** Cape Town's date the agenda was read for. */
  today: string;
  /** Calendars with a feed configured. */
  sources: CalendarSource[];
  /** Calendars whose feed couldn't be read just now. */
  failed: CalendarSource[];
  events: AgendaEvent[];
};

/** Today and tomorrow, Cape Town, from every configured calendar. */
export async function getAgenda(): Promise<Agenda> {
  await requireSession();
  const today = await getToday();
  const sources = CALENDAR_SOURCES.filter((s) => process.env[ENV[s]]);
  const results = await Promise.all(
    sources.map((source) =>
      feedAgenda(source, today).catch((error) => {
        console.error(`[calendar] ${source}:`, error);
        return null;
      }),
    ),
  );
  return {
    today,
    sources,
    failed: sources.filter((_, i) => !results[i]),
    events: results
      .flatMap((events) => events ?? [])
      .sort(
        (a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end),
      ),
  };
}

async function feedAgenda(source: CalendarSource, today: string) {
  "use cache: remote";
  // Reading a big feed takes a moment, so a few minutes' staleness is fine;
  // a meeting added now shows within ten.
  cacheLife({ stale: 300, revalidate: 600, expire: 3600 });
  const url = process.env[ENV[source]] ?? "";
  const response = await fetch(url, { cache: "no-store" });
  // The status only: the URL is a secret and stays out of logs.
  if (!response.ok) throw new Error(`feed HTTP ${response.status}`);
  const from = new Date(`${today}T00:00:00+02:00`);
  const to = new Date(from.getTime() + 2 * 864e5);
  return agendaFromIcs(
    await response.text(),
    source,
    { from, to },
    ownerOf(url),
  );
}
