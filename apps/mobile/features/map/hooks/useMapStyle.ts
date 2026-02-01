// apps/mobile/src/features/map/hooks/useMapStyle.ts
import { useCallback, useMemo, useState } from "react";
import { MAP_STYLES, MapStyleKey } from "../constants/mapStyles";

export function useMapStyle(initial: MapStyleKey = "dark") {
  const [key, setKey] = useState<MapStyleKey>(initial);

  const styleURL = useMemo(() => MAP_STYLES[key], [key]);

  const toggle = useCallback(() => {
    // Dark -> Satellite -> Streets -> Dark (repeat)
    setKey((prev) => (prev === "dark" ? "satellite" : prev === "satellite" ? "streets" : "dark"));
  }, []);

  return { key, styleURL, toggle };
}
