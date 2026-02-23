import { useCallback, useEffect, useRef, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { getDeviceLocation } from "../../emergency/services/locationService";
import {
  getWeatherSummary,
  type WeatherSummary,
} from "../services/weatherApi";

const WEATHER_REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const LOCATION_ERROR_MESSAGE = "Enable location to fetch weather alerts.";
const WEATHER_UNAVAILABLE_MESSAGE = "Unable to fetch weather right now.";

type UseWeatherSummaryResult = {
  summary: WeatherSummary | null;
  loading: boolean;
  locationMessage: string | null;
  errorMessage: string | null;
  retry: () => Promise<void>;
};

export function useWeatherSummary(): UseWeatherSummaryResult {
  const isFocused = useIsFocused();
  const [summary, setSummary] = useState<WeatherSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFetchAtRef = useRef(0);
  const inFlightRef = useRef(false);

  const refresh = useCallback(async (force: boolean) => {
    if (inFlightRef.current) return;

    const now = Date.now();
    if (!force && now - lastFetchAtRef.current < WEATHER_REFRESH_INTERVAL_MS) {
      return;
    }

    inFlightRef.current = true;
    setLoading(true);

    try {
      const location = await getDeviceLocation();
      setLocationMessage(null);

      try {
        const nextSummary = await getWeatherSummary(location.lat, location.lng);
        setSummary(nextSummary);
        setErrorMessage(null);
      } catch {
        setSummary(null);
        setErrorMessage(WEATHER_UNAVAILABLE_MESSAGE);
      }
    } catch {
      setSummary(null);
      setErrorMessage(null);
      setLocationMessage(LOCATION_ERROR_MESSAGE);
    } finally {
      lastFetchAtRef.current = Date.now();
      setLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isFocused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    void refresh(false);

    timerRef.current = setInterval(() => {
      void refresh(false);
    }, WEATHER_REFRESH_INTERVAL_MS);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isFocused, refresh]);

  const retry = useCallback(async () => {
    await refresh(true);
  }, [refresh]);

  return {
    summary,
    loading,
    locationMessage,
    errorMessage,
    retry,
  };
}
