import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../../../constants/storageKeys";

export type DevWeatherOverride = {
  enabled: boolean;
  rainfall_mm: number;
  is_raining: 0 | 1;
};

type DevWeatherOverridePatch = Partial<DevWeatherOverride>;

const DEFAULT_DEV_WEATHER_OVERRIDE: DevWeatherOverride = {
  enabled: false,
  rainfall_mm: 0,
  is_raining: 0,
};

function sanitizeRainfall(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_DEV_WEATHER_OVERRIDE.rainfall_mm;
  return Math.max(0, parsed);
}

function sanitizeIsRaining(value: unknown): 0 | 1 {
  const parsed = Number(value);
  return parsed === 1 ? 1 : 0;
}

function sanitizeOverride(value: unknown): DevWeatherOverride {
  const input = (value ?? {}) as DevWeatherOverridePatch;
  return {
    enabled: input.enabled === true,
    rainfall_mm: sanitizeRainfall(input.rainfall_mm),
    is_raining: sanitizeIsRaining(input.is_raining),
  };
}

export function useDevWeatherOverride() {
  const [override, setOverride] = useState<DevWeatherOverride>(DEFAULT_DEV_WEATHER_OVERRIDE);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.DEV_WEATHER_OVERRIDE);
        if (!raw || cancelled) return;

        const parsed = JSON.parse(raw) as unknown;
        if (!cancelled) {
          setOverride(sanitizeOverride(parsed));
        }
      } catch {
        if (!cancelled) {
          setOverride(DEFAULT_DEV_WEATHER_OVERRIDE);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const patch = useCallback((partial: DevWeatherOverridePatch) => {
    setOverride((current) => {
      const next = sanitizeOverride({ ...current, ...partial });
      void AsyncStorage.setItem(STORAGE_KEYS.DEV_WEATHER_OVERRIDE, JSON.stringify(next)).catch(
        () => {
          // ignore storage failure in dev tooling
        }
      );
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setOverride(DEFAULT_DEV_WEATHER_OVERRIDE);
    void AsyncStorage.removeItem(STORAGE_KEYS.DEV_WEATHER_OVERRIDE).catch(() => {
      // ignore storage failure in dev tooling
    });
  }, []);

  return {
    override,
    patch,
    clear,
  };
}
