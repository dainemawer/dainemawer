"use client";

import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  type LucideIcon,
  MapPin,
  Moon,
  Sun,
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { Bone } from "@/components/skeletons";
import { cn } from "@/lib/utils";
import {
  condition,
  FALLBACK_COORDS,
  HOURS_AHEAD,
  type Sky,
  type Weather,
} from "@/lib/weather";

type Coords = { lat: number; lon: number };

// The last position, so a revisit shows the weather at once instead of
// waiting on the browser's location (which can take seconds).
const STORAGE_KEY = "hud:coords";
const REFRESH_MS = 15 * 60_000;

function storedCoords(): Coords | null {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return typeof value?.lat === "number" && typeof value?.lon === "number"
      ? value
      : null;
  } catch {
    return null;
  }
}

function storeCoords(coords: Coords) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
  } catch {}
}

function locate(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator))
      return reject(new Error("No geolocation"));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lon: coords.longitude }),
      reject,
      // A town-level forecast: a cached, coarse fix is fine.
      {
        enableHighAccuracy: false,
        maximumAge: REFRESH_MS * 2,
        timeout: 15_000,
      },
    );
  });
}

export function WeatherTile() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [failed, setFailed] = useState(false);
  // True when showing Cape Town because the browser wouldn't say.
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let coords = storedCoords();

    async function load(at: Coords) {
      try {
        const response = await fetch(
          `/api/weather?lat=${at.lat}&lon=${at.lon}`,
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const next = (await response.json()) as Weather;
        if (!cancelled) {
          setWeather(next);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    if (coords) load(coords);
    // Asks for permission the first time; after that it answers quietly.
    locate().then(
      (found) => {
        const moved =
          !coords ||
          Math.abs(found.lat - coords.lat) > 0.01 ||
          Math.abs(found.lon - coords.lon) > 0.01;
        coords = found;
        storeCoords(found);
        if (!cancelled) setFallback(false);
        if (moved) load(found);
      },
      () => {
        if (coords) return;
        coords = FALLBACK_COORDS;
        if (!cancelled) setFallback(true);
        load(coords);
      },
    );
    const id = setInterval(() => coords && load(coords), REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!weather) {
    return (
      <section
        aria-label="Weather"
        aria-busy={!failed}
        className="border-t pt-3"
      >
        <p className="text-xs text-muted-foreground">
          {failed ? "Weather unavailable right now." : <Bone w="10ch" />}
        </p>
        <p className="mt-1 text-5xl font-medium">
          <Bone w="3ch" />
        </p>
        <p className="mt-1 text-sm">
          <Bone w="20ch" />
        </p>
        <p className="mt-4 text-xs">
          <Bone w="30ch" />
        </p>
        <HoursFrame>
          {Array.from({ length: HOURS_AHEAD }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed placeholders
            <li key={i} className="space-y-1">
              <Bone w="4ch" />
              <Bone w="3ch" />
            </li>
          ))}
        </HoursFrame>
      </section>
    );
  }

  const { current, today, hours, place } = weather;
  const now = condition(current.code);
  const round = Math.round;

  return (
    <section aria-label="Weather" className="border-t pt-3">
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin aria-hidden="true" className="size-3" />
        {place ?? "Your location"}
        {fallback ? " · location off, showing the default" : null}
      </p>
      <div className="mt-1 flex items-center gap-3">
        <p className="text-5xl font-medium tracking-tight tabular-nums">
          {round(current.temp)}°
        </p>
        <SkyIcon sky={now.sky} isDay={current.isDay} className="size-9" />
      </div>
      <p className="mt-1 text-sm">
        {now.label} · feels {round(current.feels)}° · H {round(today.max)}° L{" "}
        {round(today.min)}°
      </p>
      <p className="mt-4 text-xs text-muted-foreground tabular-nums">
        {[
          `Rain ${today.rain}%`,
          `Wind ${round(current.wind)} km/h`,
          `Humidity ${current.humidity}%`,
          `UV ${round(today.uv)}`,
          `Sun ${today.sunrise}–${today.sunset}`,
        ].map((stat, i) => (
          // Each stat wraps as a whole; lines break at the separators.
          <Fragment key={stat}>
            {i ? " · " : null}
            <span className="whitespace-nowrap">{stat}</span>
          </Fragment>
        ))}
      </p>
      <HoursFrame>
        {hours.map((hour) => {
          const sky = condition(hour.code);
          return (
            <li key={hour.time} className="flex flex-col items-center gap-1">
              <span className="text-muted-foreground">{hour.time}</span>
              <SkyIcon sky={sky.sky} isDay={hour.isDay} className="size-4" />
              <span className="sr-only">{sky.label}</span>
              <span className="tabular-nums">{round(hour.temp)}°</span>
              <span
                className={cn(
                  "text-[0.6875rem] tabular-nums",
                  hour.rain >= 30 ? "text-ink" : "text-muted-foreground",
                )}
              >
                {hour.rain}%
              </span>
            </li>
          );
        })}
      </HoursFrame>
    </section>
  );
}

function HoursFrame({ children }: { children: React.ReactNode }) {
  return (
    <ol
      aria-label="Next hours"
      className="mt-3 grid grid-cols-6 gap-1 border-t pt-2 text-center text-xs"
    >
      {children}
    </ol>
  );
}

const ICONS: Record<Sky, [day: LucideIcon, night: LucideIcon]> = {
  clear: [Sun, Moon],
  partly: [CloudSun, CloudMoon],
  cloudy: [Cloud, Cloud],
  fog: [CloudFog, CloudFog],
  drizzle: [CloudDrizzle, CloudDrizzle],
  rain: [CloudRain, CloudRain],
  snow: [CloudSnow, CloudSnow],
  storm: [CloudLightning, CloudLightning],
};

function SkyIcon({
  sky,
  isDay,
  className,
}: {
  sky: Sky;
  isDay: boolean;
  className?: string;
}) {
  const Icon = ICONS[sky][isDay ? 0 : 1];
  return <Icon aria-hidden="true" strokeWidth={1.5} className={className} />;
}
