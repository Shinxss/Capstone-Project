import type { EmergencyType } from "../../emergency/constants/emergency.constants";
import type { HazardType } from "../../hazardZones/constants/hazardZones.constants";

export type VolunteerStatus = "available" | "busy" | "offline";

export type Volunteer = {
  id: string;
  name: string;
  status: VolunteerStatus;
  // May be missing until the mobile app starts sending live GPS updates
  lng?: number;
  lat?: number;
  skill: string;
  barangayName?: string;
  municipality?: string;
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
};

export type HazardDraft = {
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: any;
  };
};

export type HazardDraftFormState = {
  name: string;
  hazardType: HazardType;
};
