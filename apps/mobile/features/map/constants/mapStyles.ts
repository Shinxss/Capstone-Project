// apps/mobile/src/features/map/constants/mapStyles.ts
export const MAP_STYLES = {
  dark: "mapbox://styles/mapbox/dark-v11",
  streets: "mapbox://styles/mapbox/streets-v12",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
} as const;

export type MapStyleKey = keyof typeof MAP_STYLES;
