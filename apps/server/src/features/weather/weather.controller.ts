import type { Request, Response } from "express";
import { createWeatherUnavailableSummary, getWeatherSummary } from "./weather.service";
import type { WeatherSummaryQuery } from "./weather.validation";

export async function getWeatherSummaryController(req: Request, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { lat, lng } = req.query as unknown as WeatherSummaryQuery;
    const data = await getWeatherSummary(lat, lng);
    return res.status(200).json({ data });
  } catch (error) {
    console.error("[weather] summary controller failed", error);
    return res.status(200).json({ data: createWeatherUnavailableSummary() });
  }
}
