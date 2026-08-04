import type { EmergencyType } from "../../../emergency/constants/emergency.constants";
import type { DispatchResponderSort } from "../types/dispatchResponders.types";

export const NEARBY_RESPONDER_RADIUS_KM = 10;

export const DISPATCH_SORT_OPTIONS: ReadonlyArray<{
  id: DispatchResponderSort;
  label: string;
  requires?: "rating" | "eta" | "location";
}> = [
  { id: "bestMatch", label: "Best Match" },
  { id: "nearest", label: "Nearest", requires: "location" },
  { id: "highestRated", label: "Highest Rated", requires: "rating" },
  { id: "fastestEta", label: "Fastest ETA", requires: "eta" },
  { id: "name", label: "Name" },
  { id: "recentlyActive", label: "Recently Active" },
];

export const EMERGENCY_TRAINING_CONFIG: Record<
  EmergencyType,
  { label: string; terms: readonly string[] }
> = {
  SOS: { label: "Search & Rescue", terms: ["search and rescue", "rescue", "first aid", "cpr"] },
  FIRE: { label: "Fire Trained", terms: ["fire", "firefighting"] },
  FLOOD: { label: "Flood Response", terms: ["flood", "water rescue", "swift water"] },
  TYPHOON: { label: "Typhoon Response", terms: ["typhoon", "storm", "disaster response"] },
  EARTHQUAKE: { label: "Search & Rescue", terms: ["search and rescue", "urban search", "rescue"] },
  COLLAPSE: { label: "Search & Rescue", terms: ["search and rescue", "urban search", "rescue"] },
  MEDICAL: { label: "Medical Trained", terms: ["medical", "first aid", "cpr", "nurse", "emt"] },
  OTHER: { label: "Emergency Trained", terms: ["emergency", "rescue", "first aid"] },
};
