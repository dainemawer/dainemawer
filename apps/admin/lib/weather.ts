// The dashboard HUD's weather: Open-Meteo's forecast trimmed to what the
// tile shows, and WMO weather codes in words. Pure, so the tests (and the
// client tile, for the types) can import it; the fetching is in
// app/api/weather/route.ts.

export type Sky =
  | "clear"
  | "partly"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "storm";

export type Weather = {
  place: string | null;
  current: {
    temp: number;
    feels: number;
    code: number;
    isDay: boolean;
    wind: number;
    humidity: number;
  };
  today: {
    max: number;
    min: number;
    rain: number;
    uv: number;
    /** Local `HH:MM` at the location. */
    sunrise: string;
    sunset: string;
  };
  /** The next few hours after the current one. */
  hours: {
    time: string;
    temp: number;
    rain: number;
    code: number;
    isDay: boolean;
  }[];
};

// https://open-meteo.com/en/docs (WMO weather interpretation codes)
const CONDITIONS: Record<number, [label: string, sky: Sky]> = {
  0: ["Clear", "clear"],
  1: ["Mostly clear", "partly"],
  2: ["Partly cloudy", "partly"],
  3: ["Overcast", "cloudy"],
  45: ["Fog", "fog"],
  48: ["Freezing fog", "fog"],
  51: ["Light drizzle", "drizzle"],
  53: ["Drizzle", "drizzle"],
  55: ["Heavy drizzle", "drizzle"],
  56: ["Freezing drizzle", "drizzle"],
  57: ["Freezing drizzle", "drizzle"],
  61: ["Light rain", "rain"],
  63: ["Rain", "rain"],
  65: ["Heavy rain", "rain"],
  66: ["Freezing rain", "rain"],
  67: ["Freezing rain", "rain"],
  71: ["Light snow", "snow"],
  73: ["Snow", "snow"],
  75: ["Heavy snow", "snow"],
  77: ["Snow grains", "snow"],
  80: ["Showers", "rain"],
  81: ["Showers", "rain"],
  82: ["Heavy showers", "rain"],
  85: ["Snow showers", "snow"],
  86: ["Snow showers", "snow"],
  95: ["Thunderstorm", "storm"],
  96: ["Thunderstorm, hail", "storm"],
  99: ["Thunderstorm, hail", "storm"],
};

export function condition(code: number): { label: string; sky: Sky } {
  const [label, sky] = CONDITIONS[code] ?? ["Unknown", "cloudy"];
  return { label, sky };
}

/** How many hours after the current one the tile lists. */
export const HOURS_AHEAD = 6;

/** Where the browser can't or won't say: Cape Town. */
export const FALLBACK_COORDS = { lat: -33.92, lon: 18.42 } as const;

/**
 * Coordinates rounded to about a kilometre: plenty for a forecast, less
 * precise than the device's position, and a stable cache key. Null for
 * anything that isn't a real latitude and longitude.
 */
export function roundCoords(
  lat: unknown,
  lon: unknown,
): { lat: number; lon: number } | null {
  const la = Number(lat);
  const lo = Number(lon);
  if (lat === null || lat === "" || lon === null || lon === "") return null;
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
  if (Math.abs(la) > 90 || Math.abs(lo) > 180) return null;
  return { lat: Math.round(la * 100) / 100, lon: Math.round(lo * 100) / 100 };
}

// The parts of Open-Meteo's response that FORECAST_PARAMS asks for.
export type OpenMeteoForecast = {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    weather_code: number;
    is_day: number;
    wind_speed_10m: number;
    relative_humidity_2m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
    is_day: number[];
  };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
  };
};

export const FORECAST_PARAMS = {
  current:
    "temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m,relative_humidity_2m",
  hourly: "temperature_2m,precipitation_probability,weather_code,is_day",
  daily:
    "temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max",
  // Times come back in the location's own zone, so sunrise reads locally.
  timezone: "auto",
  forecast_days: "1",
  // The current hour plus the ones after it.
  forecast_hours: String(HOURS_AHEAD + 1),
};

const hhmm = (iso: string) => iso.slice(11, 16);

export function toWeather(
  forecast: OpenMeteoForecast,
  place: string | null,
): Weather {
  const { current: c, hourly: h, daily: d } = forecast;
  return {
    place,
    current: {
      temp: c.temperature_2m,
      feels: c.apparent_temperature,
      code: c.weather_code,
      isDay: c.is_day === 1,
      wind: c.wind_speed_10m,
      humidity: c.relative_humidity_2m,
    },
    today: {
      max: d.temperature_2m_max[0],
      min: d.temperature_2m_min[0],
      rain: d.precipitation_probability_max[0] ?? 0,
      uv: d.uv_index_max[0] ?? 0,
      sunrise: hhmm(d.sunrise[0]),
      sunset: hhmm(d.sunset[0]),
    },
    // The first hourly entry is the current hour, which `current` covers.
    hours: h.time.slice(1, HOURS_AHEAD + 1).map((time, i) => ({
      time: hhmm(time),
      temp: h.temperature_2m[i + 1],
      rain: h.precipitation_probability[i + 1] ?? 0,
      code: h.weather_code[i + 1],
      isDay: h.is_day[i + 1] === 1,
    })),
  };
}
