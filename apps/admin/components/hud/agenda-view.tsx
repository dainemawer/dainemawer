"use client";

import { Video } from "lucide-react";
import { useSyncExternalStore } from "react";
import {
  type AgendaEvent,
  agendaNow,
  type CalendarSource,
  clockTime,
  dayOf,
  durationLabel,
  SOURCE_LABEL,
  untilLabel,
} from "@/lib/agenda";
import { todayISO } from "@/lib/documents";
import { cn } from "@/lib/utils";

const TOMORROW_LIMIT = 5;

function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 15_000);
  return () => clearInterval(id);
}
const currentMinute = () => Math.floor(Date.now() / 60_000);
// No "now" on the server: the list renders, the live parts fill in.
const noMinute = () => null;

export function AgendaView({
  today: serverToday,
  events,
  sources,
  failed,
}: {
  today: string;
  events: AgendaEvent[];
  sources: CalendarSource[];
  failed: CalendarSource[];
}) {
  const minute = useSyncExternalStore(subscribe, currentMinute, noMinute);
  const now = minute === null ? null : new Date(minute * 60_000);
  const live = now ? agendaNow(events, now) : null;
  // The server's date until the browser has a clock (they agree, bar the
  // minutes around midnight).
  const today = now ? todayISO(now) : serverToday;
  // Today's list holds anything that started by today (including all-day
  // events that began earlier); the rest is tomorrow's.
  const todays = events.filter((e) => dayOf(e.start) <= today);
  const tomorrows = events.filter((e) => !todays.includes(e));

  return (
    <>
      <p className="mt-1 min-h-lh truncate text-sm">
        {live ? <Headline live={live} /> : null}
      </p>
      <p className="mt-1 min-h-lh text-xs text-muted-foreground">
        {live ? `${durationLabel(live.freeMinutes)} free today` : null}
        {failed.length ? (
          <span className="text-destructive">
            {live ? " · " : null}
            Couldn't read {failed.map((s) => SOURCE_LABEL[s]).join(" and ")}
          </span>
        ) : null}
      </p>

      {sources.length > 1 ? (
        <ul className="mt-3 flex gap-3 text-xs text-muted-foreground">
          {sources.map((s) => (
            <li key={s} className="inline-flex items-center gap-1.5">
              <SourceDot source={s} />
              {SOURCE_LABEL[s]}
            </li>
          ))}
        </ul>
      ) : null}

      <Day title="Today" events={todays} now={now} />
      <Day
        title="Tomorrow"
        events={tomorrows.slice(0, TOMORROW_LIMIT)}
        more={Math.max(0, tomorrows.length - TOMORROW_LIMIT)}
        now={now}
      />
    </>
  );
}

function Headline({ live }: { live: ReturnType<typeof agendaNow> }) {
  const current = live.current[0];
  if (current) {
    return (
      <>
        <span className="text-muted-foreground">Now · </span>
        <span className="font-medium">{current.title}</span>
        <span className="text-muted-foreground">
          {" "}
          until {clockTime(current.end)}
        </span>
      </>
    );
  }
  if (live.next && live.nextIn !== null) {
    return (
      <>
        <span className="text-muted-foreground">Next · </span>
        <span className="font-medium">{live.next.title}</span>
        <span className="text-muted-foreground">
          {" "}
          {untilLabel(live.nextIn)}
        </span>
      </>
    );
  }
  return <span className="text-muted-foreground">Nothing else booked</span>;
}

function Day({
  title,
  events,
  more = 0,
  now,
}: {
  title: string;
  events: AgendaEvent[];
  more?: number;
  now: Date | null;
}) {
  return (
    <div className="mt-4">
      <h3 className="mb-1 text-xs text-muted-foreground">{title}</h3>
      {events.length ? (
        <ul className="divide-y border-y text-sm">
          {events.map((e) => {
            const past = now !== null && Date.parse(e.end) <= now.getTime();
            const current =
              now !== null &&
              !e.allDay &&
              Date.parse(e.start) <= now.getTime() &&
              !past;
            return (
              <li
                key={e.id}
                aria-current={current ? "time" : undefined}
                className={cn(
                  "flex items-center gap-3 py-1.5",
                  past && "text-muted-foreground",
                )}
              >
                <span className="w-[5.5rem] shrink-0 text-xs tabular-nums text-muted-foreground">
                  {e.allDay
                    ? "All day"
                    : `${clockTime(e.start)}–${clockTime(e.end)}`}
                </span>
                <SourceDot source={e.source} />
                <span className="sr-only">{SOURCE_LABEL[e.source]}: </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate",
                    current && "font-medium",
                  )}
                  title={e.location ? `${e.title} · ${e.location}` : e.title}
                >
                  {e.title}
                </span>
                {e.joinUrl && !past ? (
                  <a
                    href={e.joinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-sm p-0.5 text-muted-foreground hover:text-ink"
                  >
                    <Video aria-hidden="true" className="size-4" />
                    <span className="sr-only">Join {e.title}</span>
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="border-y py-1.5 text-sm text-muted-foreground">
          Nothing booked
        </p>
      )}
      {more ? (
        <p className="mt-1 text-xs text-muted-foreground">+{more} more</p>
      ) : null}
    </div>
  );
}

function SourceDot({ source }: { source: CalendarSource }) {
  // Filled for work, hollow for personal: tells them apart without colour.
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-2 shrink-0 rounded-full border border-ink",
        source === "work" && "bg-ink",
      )}
    />
  );
}
