import { cacheLife } from "next/cache";
import { auth } from "@/lib/auth";
import {
  FORECAST_PARAMS,
  type OpenMeteoForecast,
  roundCoords,
  toWeather,
} from "@/lib/weather";

// The dashboard HUD's weather tile, for the browser's location. Fetched
// here rather than from the browser so the CSP can keep connect-src 'self'.
// Coordinates are rounded to about a kilometre before they leave the
// server: Open-Meteo (forecast, no key) and OpenStreetMap's Nominatim
// (place name) only ever see that.

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const params = new URL(request.url).searchParams;
  const coords = roundCoords(params.get("lat"), params.get("lon"));
  if (!coords) return new Response("Bad coordinates", { status: 400 });

  try {
    const [forecast, place] = await Promise.all([
      fetchForecast(coords.lat, coords.lon),
      fetchPlaceName(coords.lat, coords.lon).catch(() => null),
    ]);
    return Response.json(toWeather(forecast, place), {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (error) {
    console.error("[weather]", error);
    return new Response("Weather unavailable", { status: 502 });
  }
}

async function fetchForecast(lat: number, lon: number) {
  "use cache: remote";
  // Open-Meteo updates its models about every 15 minutes.
  cacheLife({ stale: 300, revalidate: 900, expire: 3600 });
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    ...FORECAST_PARAMS,
  }).toString();
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Open-Meteo: HTTP ${response.status}`);
  return (await response.json()) as OpenMeteoForecast;
}

/** The town or suburb, e.g. "Cape Town". Places don't move, so it's cached for weeks (Nominatim asks for light, cached use). */
async function fetchPlaceName(lat: number, lon: number) {
  "use cache: remote";
  cacheLife("weeks");
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.search = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "jsonv2",
    // City level: a town name, not a street address.
    zoom: "10",
  }).toString();
  const response = await fetch(url, {
    headers: {
      "User-Agent": "dainemawer-admin/1.0 (+https://admin.dainemawer.com)",
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Nominatim: HTTP ${response.status}`);
  const body = (await response.json()) as {
    name?: string;
    address?: { city?: string; town?: string; village?: string };
  };
  const { city, town, village } = body.address ?? {};
  return city ?? town ?? village ?? body.name ?? null;
}
