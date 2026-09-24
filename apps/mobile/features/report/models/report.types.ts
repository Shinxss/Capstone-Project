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

export type ReportPhoto = {
  localUri: string;
  url?: string;
  base64?: string;
  uploading?: boolean;
  error?: string;
  mimeType?: string;
  fileName?: string;
};

export type ReportDraft = {
  type?: EmergencyType;
  location?: ReportLocation;
  locationText?: string;
  description?: string;
  photos?: ReportPhoto[];
};

export interface EmergencyTypeOption {
  key: EmergencyType;
  label: string;
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
}

export type ReportDeliveryMode = "online" | "offline_sms" | "offline_queued";

export type ReportSubmitResult = {
  incidentId: string;
  referenceNumber: string;
  isSos: boolean;
  verificationStatus: "not_required" | "pending" | "approved" | "rejected";
  isVisibleOnMap: boolean;
  createdAt: string;
  location: ReportLocation;
  deliveryMode?: ReportDeliveryMode;
  clientRequestId?: string;
  smsStatus?: string;
};
