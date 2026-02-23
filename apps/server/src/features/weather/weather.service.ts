import type { WeatherAlertCopy, WeatherSeverity, WeatherSummary } from "./weather.types";

const OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_TIMEOUT_MS = 4_000;
const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000;

const HEAVY_WEATHER_CODES = new Set([65, 82, 95, 96, 99]);
const MODERATE_WEATHER_CODES = new Set([63, 81]);
const LIGHT_WEATHER_CODES = new Set([61, 80, 51, 53, 55]);
const THUNDERSTORM_CODES = new Set([95, 96, 99]);

type OpenMeteoCurrent = {
  precipitation?: unknown;
  rain?: unknown;
  weather_code?: unknown;
  wind_speed_10m?: unknown;
};

type OpenMeteoForecastResponse = {
  current?: OpenMeteoCurrent | null;
};

type WeatherCacheEntry = {
  expiresAt: number;
  summary: WeatherSummary;
};

const weatherCache = new Map<string, WeatherCacheEntry>();

function nowIsoString(): string {
  return new Date().toISOString();
}

function toCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

function toNonNegativeNumberOrNull(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function toWeatherCode(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.trunc(parsed);
}

function roundRainfall(value: number): number {
  return Number(value.toFixed(2));
}

function deriveRainfallMm(current: OpenMeteoCurrent | null | undefined): number {
  const precipitation = toNonNegativeNumberOrNull(current?.precipitation);
  const rain = toNonNegativeNumberOrNull(current?.rain);

  if (precipitation !== null && rain !== null) {
    return roundRainfall(Math.max(precipitation, rain));
  }

  if (precipitation !== null) {
    return roundRainfall(precipitation);
  }

  if (rain !== null) {
    return roundRainfall(rain);
  }

  return 0;
}

function deriveSeverity(rainfallMm: number, weatherCode: number | null): WeatherSeverity {
  if (rainfallMm >= 7 || (weatherCode !== null && HEAVY_WEATHER_CODES.has(weatherCode))) {
    return "HEAVY";
  }

  if (rainfallMm >= 2 || (weatherCode !== null && MODERATE_WEATHER_CODES.has(weatherCode))) {
    return "MODERATE";
  }

  if (rainfallMm > 0 || (weatherCode !== null && LIGHT_WEATHER_CODES.has(weatherCode))) {
    return "LIGHT";
  }

  return "NONE";
}

function severityLabel(severity: WeatherSeverity): string {
  if (severity === "HEAVY") return "Heavy";
  if (severity === "MODERATE") return "Moderate";
  if (severity === "LIGHT") return "Light";
  return "None";
}

function describeWeatherCondition(weatherCode: number | null): string {
  if (weatherCode === null) return "Fair weather";
  if (weatherCode === 0) return "Sunny";
  if (weatherCode === 1) return "Mostly sunny";
  if (weatherCode === 2) return "Partly cloudy";
  if (weatherCode === 3) return "Cloudy";
  if (weatherCode === 45 || weatherCode === 48) return "Foggy";

  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return "Snowy";
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return "Stormy";
  }

  return "Variable conditions";
}

function buildAlertCopy(
  severity: WeatherSeverity,
  rainfallMm: number,
  weatherCode: number | null,
  windSpeed10mKph: number | null
): WeatherAlertCopy {
  const rounded = Number(rainfallMm.toFixed(1));
  const rainfallText = `${rounded} mm`;

  if (weatherCode !== null && THUNDERSTORM_CODES.has(weatherCode)) {
    return {
      title: "Thunderstorm risk",
      message: `Thunderstorm risk in your area. Estimated rainfall: ${rainfallText}.`,
    };
  }

  if (severity === "NONE") {
    const windLabel =
      windSpeed10mKph !== null && windSpeed10mKph >= 30
        ? "Very windy"
        : windSpeed10mKph !== null && windSpeed10mKph >= 20
          ? "Windy"
          : null;
    const condition = describeWeatherCondition(weatherCode);
    const title = windLabel ?? condition;
    const weatherText = windLabel ? `${condition}, ${windLabel.toLowerCase()}` : condition;
    return {
      title,
      message: `No rainfall expected (${rainfallText}). Weather: ${weatherText}.`,
    };
  }

  return {
    title: `Expected rainfall: ${severityLabel(severity)}`,
    message: `Expected rainfall: ${severityLabel(severity)} (${rainfallText}).`,
  };
}

function toWeatherSummary(current: OpenMeteoCurrent | null | undefined): WeatherSummary {
  const rainfallMm = deriveRainfallMm(current);
  const weatherCode = toWeatherCode(current?.weather_code);
  const windSpeed10mKph = toNonNegativeNumberOrNull(current?.wind_speed_10m);
  const severity = deriveSeverity(rainfallMm, weatherCode);
  const copy = buildAlertCopy(severity, rainfallMm, weatherCode, windSpeed10mKph);

  return {
    rainfall_mm: rainfallMm,
    is_raining: rainfallMm > 0 ? 1 : 0,
    weather_code: weatherCode,
    severity,
    title: copy.title,
    message: copy.message,
    updatedAt: nowIsoString(),
  };
}

export function createWeatherUnavailableSummary(): WeatherSummary {
  return {
    rainfall_mm: 0,
    is_raining: 0,
    weather_code: null,
    severity: "NONE",
    title: "Weather unavailable",
    message: "Unable to fetch weather right now.",
    updatedAt: nowIsoString(),
  };
}

async function fetchOpenMeteoCurrent(lat: number, lng: number): Promise<OpenMeteoCurrent> {
  const url = new URL(OPEN_METEO_FORECAST_URL);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("current", "precipitation,rain,weather_code,wind_speed_10m");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("precipitation_unit", "mm");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPEN_METEO_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo request failed with status ${response.status}`);
    }

    const body = (await response.json()) as OpenMeteoForecastResponse;
    return body.current ?? {};
  } finally {
    clearTimeout(timeout);
  }
}

function readCachedWeather(key: string): WeatherSummary | null {
  const cached = weatherCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    weatherCache.delete(key);
    return null;
  }
  return cached.summary;
}

function writeCachedWeather(key: string, summary: WeatherSummary): WeatherSummary {
  weatherCache.set(key, {
    summary,
    expiresAt: Date.now() + WEATHER_CACHE_TTL_MS,
  });
  return summary;
}

export async function getWeatherSummary(lat: number, lng: number): Promise<WeatherSummary> {
  const cacheKey = toCacheKey(lat, lng);
  const cached = readCachedWeather(cacheKey);
  if (cached) return cached;

  try {
    const current = await fetchOpenMeteoCurrent(lat, lng);
    const summary = toWeatherSummary(current);
    return writeCachedWeather(cacheKey, summary);
  } catch (error) {
    console.warn("[weather] open-meteo fetch failed", {
      lat,
      lng,
      message: error instanceof Error ? error.message : "Unknown weather error",
    });

    const fallback = createWeatherUnavailableSummary();
    return writeCachedWeather(cacheKey, fallback);
  }
}
