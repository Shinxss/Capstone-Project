import type { EmergencyType } from "../../../emergency/constants/emergency.constants";
import type { Volunteer, VolunteerStatus } from "../../models/lguLiveMap.types";

export type DispatchResponderFilter =
  | "recommended"
  | "all"
  | "nearby"
  | "topRated"
  | "trained"
  | "available";

export type DispatchResponderSort =
  | "bestMatch"
  | "nearest"
  | "highestRated"
  | "fastestEta"
  | "name"
  | "recentlyActive";

export type RecommendationLabel = "Best Match" | "Nearby" | "Skill Match";

export type DispatchableResponder = Omit<Volunteer, "rating" | "reviewCount" | "etaMinutes"> & {
  skills: string[];
  availability: VolunteerStatus;
  distanceKm: number | null;
  etaMinutes: number | null;
  rating: number | null;
  reviewCount: number | null;
  isAssigned: boolean;
  isDispatchable: boolean;
  matchesEmergencyTraining: boolean;
};

export type DispatchResponderFilterOption = {
  id: DispatchResponderFilter;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
};

export type DispatchEmergencyContext = {
  id: string;
  referenceNumber: string;
  emergencyType: EmergencyType;
  title: string;
  location: string;
  lng: number;
  lat: number;
  dispatchable: boolean;
};

export type PresenceConnectionState = "connecting" | "live" | "reconnecting";
