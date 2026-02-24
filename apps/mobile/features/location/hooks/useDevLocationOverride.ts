import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../../../constants/storageKeys";

export type DevLocationOverride = {
  enabled: boolean;
  lat: number;
  lng: number;
};

type DevLocationOverridePatch = Partial<DevLocationOverride>;

export const DEV_LOCATION_DAGUPAN_PRESET = {
  lat: 16.084355335757174,
  lng: 120.34786408866671,
} as const;

const DEFAULT_DEV_LOCATION_OVERRIDE: DevLocationOverride = {
  enabled: false,
  lat: DEV_LOCATION_DAGUPAN_PRESET.lat,
  lng: DEV_LOCATION_DAGUPAN_PRESET.lng,
};

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
}

function sanitizeOverride(value: unknown): DevLocationOverride {
  const input = (value ?? {}) as DevLocationOverridePatch;
  return {
    enabled: input.enabled === true,
    lat: clampNumber(input.lat, -90, 90, DEFAULT_DEV_LOCATION_OVERRIDE.lat),
    lng: clampNumber(input.lng, -180, 180, DEFAULT_DEV_LOCATION_OVERRIDE.lng),
  };
}

export function useDevLocationOverride() {
  const [override, setOverride] = useState<DevLocationOverride>(DEFAULT_DEV_LOCATION_OVERRIDE);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.DEV_LOCATION_OVERRIDE);
        if (!raw || cancelled) return;

        const parsed = JSON.parse(raw) as unknown;
        if (!cancelled) {
          setOverride(sanitizeOverride(parsed));
        }
      } catch {
        if (!cancelled) {
          setOverride(DEFAULT_DEV_LOCATION_OVERRIDE);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const patch = useCallback((partial: DevLocationOverridePatch) => {
    setOverride((current) => {
      const next = sanitizeOverride({ ...current, ...partial });
      void AsyncStorage.setItem(STORAGE_KEYS.DEV_LOCATION_OVERRIDE, JSON.stringify(next)).catch(
        () => {
          // ignore storage failure in dev tooling
        }
      );
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setOverride(DEFAULT_DEV_LOCATION_OVERRIDE);
    void AsyncStorage.removeItem(STORAGE_KEYS.DEV_LOCATION_OVERRIDE).catch(() => {
      // ignore storage failure in dev tooling
    });
  }, []);

  return {
    override,
    patch,
    clear,
  };
}
