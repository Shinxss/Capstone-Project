import type { EmergencyType } from "../../emergency/constants/emergency.constants";
import type { HazardType } from "../../hazardZones/constants/hazardZones.constants";

export type VolunteerStatus = "available" | "busy" | "idle" | "offline";

export type Volunteer = {
  id: string;
  lifelineId?: string;
  name: string;
  status: VolunteerStatus;
  lastSeenAt?: string;
  // May be missing until the mobile app starts sending live GPS updates
  lng?: number;
  lat?: number;
  skill: string;
  barangayName?: string;
  municipality?: string;
  avatarUrl?: string;
  teamName?: string;
  role?: string;
  rating?: number;
  reviewCount?: number;
  etaMinutes?: number;
  recommendationScore?: number;
  recommendationReasons?: string[];
};

export type MapStyleKey = "satellite-streets-v12" | "streets-v12" | "dark-v11";

export type LguEmergencyDetails = {
  id: string;
  emergencyType: EmergencyType;
  status: string;
  source?: string | null;
  lng: number;
  lat: number;
  notes?: string | null;
  reportedAt?: string;
  barangayName?: string | null;
  locationLabel?: string | null;
  referenceNumber?: string | null;
};

export type HazardDraft = {
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
};

export type HazardDraftFormState = {
  name: string;
  hazardType: HazardType;
};
