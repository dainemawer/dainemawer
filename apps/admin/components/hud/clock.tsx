"use client";

import { useSyncExternalStore } from "react";
import { Bone } from "@/components/skeletons";
import { clockFace } from "@/lib/hud";

function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}
const currentSecond = () => Math.floor(Date.now() / 1000);
// The server (and the prerendered shell) has no "now" to show: the time
// only appears in the browser, so it can't be stale or mismatch.
const noSecond = () => null;

export function Clock() {
  const second = useSyncExternalStore(subscribe, currentSecond, noSecond);
  const face = second === null ? null : clockFace(new Date(second * 1000));
  const percent = face ? Math.floor(face.yearProgress * 100) : 0;

  return (
    <section aria-label="Today" className="border-t pt-3">
      <p className="text-xs text-muted-foreground">
        {face ? face.weekday : <Bone w="9ch" />}
      </p>
      <p className="mt-1 text-5xl font-medium tracking-tight tabular-nums">
        {face ? (
          <time dateTime={face.time}>
            {face.time}
            <span className="text-xl text-muted-foreground">
              :{face.seconds}
            </span>
          </time>
        ) : (
          <Bone w="5ch" />
        )}
      </p>
      <p className="mt-1 text-sm">{face ? face.date : <Bone w="15ch" />}</p>
      <p className="mt-4 text-xs text-muted-foreground tabular-nums">
        {face ? (
          <>
            Day {face.dayOfYear}/{face.daysInYear} · Week {face.week} ·{" "}
            {percent}% of the year
          </>
        ) : (
          <Bone w="28ch" />
        )}
      </p>
      <div
        role="progressbar"
        aria-label="Year so far"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mt-2 h-1 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-ink"
          style={{ width: `${face ? face.yearProgress * 100 : 0}%` }}
        />
      </div>
    </section>
  );
}
