import type { VolunteerStatus } from "../models/lguLiveMap.types";

export function colorForVolunteerStatus(s: VolunteerStatus) {
  switch (s) {
    case "available":
      return "#22c55e";
    case "busy":
      return "#f97316";
    case "offline":
      return "#ef4444";
    default:
      return "#94a3b8";
  }
}
