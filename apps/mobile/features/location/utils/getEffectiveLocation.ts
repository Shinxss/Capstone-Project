import type { DevLocationOverride } from "../hooks/useDevLocationOverride";
import { DEV_LOCATION_DAGUPAN_PRESET } from "../hooks/useDevLocationOverride";

export type BasicLocation = {
  lat: number;
  lng: number;
};

export type EffectiveLocation = BasicLocation & {
  source: "dev" | "gps";
};

export function getEffectiveLocation(
  devOverride: DevLocationOverride,
  gpsLocation: BasicLocation | null
): EffectiveLocation {
  if (devOverride.enabled) {
    return {
      lat: devOverride.lat,
      lng: devOverride.lng,
      source: "dev",
    };
  }

  if (gpsLocation) {
    return {
      lat: gpsLocation.lat,
      lng: gpsLocation.lng,
      source: "gps",
    };
  }

  return {
    lat: DEV_LOCATION_DAGUPAN_PRESET.lat,
    lng: DEV_LOCATION_DAGUPAN_PRESET.lng,
    source: "gps",
  };
}
