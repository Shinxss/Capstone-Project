import { api } from "../../../lib/api";

export type WeatherSeverity = "NONE" | "LIGHT" | "MODERATE" | "HEAVY";

export type WeatherSummary = {
  rainfall_mm: number;
  is_raining: 0 | 1;
  weather_code: number | null;
  severity: WeatherSeverity;
  title: string;
  message: string;
  updatedAt: string;
};

type WeatherSummaryResponse = {
  data?: WeatherSummary;
};

export async function getWeatherSummary(lat: number, lng: number): Promise<WeatherSummary> {
  const response = await api.get<WeatherSummaryResponse>("/api/weather/summary", {
    params: {
      lat,
      lng,
    },
  });

  const summary = response.data?.data;
  if (!summary || typeof summary.rainfall_mm !== "number") {
    throw new Error("Invalid weather summary response");
  }

  return summary;
}
