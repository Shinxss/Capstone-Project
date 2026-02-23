import type { ReactNode } from "react";

export type EmergencyType =
  | "fire"
  | "flood"
  | "typhoon"
  | "earthquake"
  | "collapse"
  | "medical"
  | "other";

export type ReportLocation = {
  coords: {
    latitude: number;
    longitude: number;
  };
  label?: string;
};

export type ReportDraft = {
  type?: EmergencyType;
  location?: ReportLocation;
  description?: string;
  photos?: string[];
};

export interface EmergencyTypeOption {
  key: EmergencyType;
  label: string;
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
}

export type ReportSubmitResult = {
  incidentId: string;
  referenceNumber: string;
  isSos: boolean;
  verificationStatus: "not_required" | "pending" | "approved" | "rejected";
  isVisibleOnMap: boolean;
  createdAt: string;
  location: ReportLocation;
};
