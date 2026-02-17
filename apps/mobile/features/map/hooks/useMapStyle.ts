import { useCallback, useMemo, useState } from "react";
import { MAP_STYLES, MapStyleKey } from "../constants/mapStyles";

export function useMapStyle(initial: MapStyleKey = "streets") {
  const [key, setKey] = useState<MapStyleKey>(initial);

  const styleURL = useMemo(() => MAP_STYLES[key], [key]);

  const next = useCallback(() => {
    setKey((prev) => (prev === "dark" ? "streets" : prev === "streets" ? "satellite" : "dark"));
  }, []);

  return { key, styleURL, setKey, next };
}
