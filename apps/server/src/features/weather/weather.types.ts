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

export type WeatherAlertCopy = {
  title: string;
  message: string;
};
