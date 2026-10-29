import assert from "node:assert/strict";
import { test } from "node:test";
import { clockFace, isoWeek } from "../lib/hud.ts";
import {
  condition,
  HOURS_AHEAD,
  type OpenMeteoForecast,
  roundCoords,
  toWeather,
} from "../lib/weather.ts";

test("clockFace reads Cape Town time, not the machine's", () => {
  // 22:30 UTC on 31 Dec is already 00:30 on 1 Jan in Cape Town.
  const face = clockFace(new Date("2026-12-31T22:30:15Z"));
  assert.equal(face.weekday, "Friday");
  assert.equal(face.date, "1 January 2027");
  assert.equal(face.time, "00:30");
  assert.equal(face.seconds, "15");
  assert.equal(face.dayOfYear, 1);
  assert.equal(face.daysInYear, 365);
  assert.equal(face.week, 53);
});

test("clockFace counts days and progress through the year", () => {
  const face = clockFace(new Date("2026-10-28T10:00:00Z"));
  assert.equal(face.dayOfYear, 301);
  assert.equal(face.week, 44);
  assert.equal(face.time, "12:00");
  assert.ok(Math.abs(face.yearProgress - 300.5 / 365) < 1e-9);
  const leap = clockFace(new Date("2028-12-31T12:00:00Z"));
  assert.equal(leap.dayOfYear, 366);
  assert.equal(leap.daysInYear, 366);
});

test("isoWeek follows ISO 8601 at year edges", () => {
  assert.equal(isoWeek(Date.UTC(2026, 0, 1)), 1);
  assert.equal(isoWeek(Date.UTC(2027, 0, 3)), 53);
  assert.equal(isoWeek(Date.UTC(2024, 11, 30)), 1);
});

test("condition names WMO codes and tolerates unknown ones", () => {
  assert.deepEqual(condition(0), { label: "Clear", sky: "clear" });
  assert.deepEqual(condition(63), { label: "Rain", sky: "rain" });
  assert.deepEqual(condition(42), { label: "Unknown", sky: "cloudy" });
});

test("roundCoords rounds to two decimals and refuses nonsense", () => {
  assert.deepEqual(roundCoords("-33.92491", "18.42412"), {
    lat: -33.92,
    lon: 18.42,
  });
  for (const [lat, lon] of [
    [null, "18"],
    ["", "18"],
    ["abc", "18"],
    ["91", "18"],
    ["-33", "181"],
    ["Infinity", "0"],
  ]) {
    assert.equal(roundCoords(lat, lon), null, `${lat},${lon}`);
  }
});

test("toWeather trims the forecast to the tile", () => {
  const hours = HOURS_AHEAD + 1;
  const series = (f: (i: number) => number) =>
    Array.from({ length: hours }, (_, i) => f(i));
  const forecast: OpenMeteoForecast = {
    current: {
      temperature_2m: 25.4,
      apparent_temperature: 24.8,
      weather_code: 0,
      is_day: 1,
      wind_speed_10m: 16.7,
      relative_humidity_2m: 34,
    },
    hourly: {
      time: series((i) => i).map(
        (i) => `2026-10-28T${String(13 + i).padStart(2, "0")}:00`,
      ),
      temperature_2m: series((i) => 25 - i),
      precipitation_probability: series((i) => i * 10),
      weather_code: series(() => 3),
      is_day: series((i) => (i < 6 ? 1 : 0)),
    },
    daily: {
      temperature_2m_max: [25.6],
      temperature_2m_min: [13.4],
      precipitation_probability_max: [2],
      sunrise: ["2026-10-28T05:49"],
      sunset: ["2026-10-28T19:10"],
      uv_index_max: [8.6],
    },
  };
  const weather = toWeather(forecast, "Cape Town");
  assert.equal(weather.place, "Cape Town");
  assert.equal(weather.current.isDay, true);
  assert.equal(weather.today.sunrise, "05:49");
  assert.equal(weather.today.sunset, "19:10");
  assert.equal(weather.hours.length, HOURS_AHEAD);
  assert.deepEqual(weather.hours[0], {
    time: "14:00",
    temp: 24,
    rain: 10,
    code: 3,
    isDay: true,
  });
  assert.equal(weather.hours.at(-1)?.isDay, false);
});
