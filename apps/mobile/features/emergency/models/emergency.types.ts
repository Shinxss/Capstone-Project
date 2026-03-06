export type EmergencyStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "CANCELLED";
export type EmergencySource = "SOS_BUTTON" | "REPORT_FORM" | "SMS_OFFLINE";
export type EmergencyType = "SOS" | "FIRE" | "FLOOD" | "EARTHQUAKE" | "MEDICAL" | "OTHER";

export type SosCreateRequest = {
  lat: number;
  lng: number;
  accuracy?: number;
  notes?: string;
  locationLabel?: string;
};

export type EmergencyReport = {
  _id: string;
  emergencyType: EmergencyType;
  status: EmergencyStatus;
  source: EmergencySource;
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
    accuracy?: number;
  };
  reportedBy: string; // user id (from JWT)
  reportedAt: string;
};

export type MapEmergencyReport = {
  incidentId: string;
  referenceNumber: string;
  isSos: boolean;
  type: string;
  status?: "open" | "assigned" | "in_progress" | "resolved" | "cancelled";
  verificationStatus: "not_required" | "pending" | "approved" | "rejected";
  isVisibleOnMap: boolean;
  createdAt: string;
  location: {
    coords: {
      latitude: number;
      longitude: number;
    };
    label?: string;
  };
  description?: string;
};

export type EmergencyReportDetail = {
  incidentId: string;
  referenceNumber: string;
  type: string;
  status: "open" | "assigned" | "in_progress" | "resolved" | "cancelled";
  reportedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  location: {
    coords: {
      latitude: number;
      longitude: number;
    };
    label?: string;
  };
  photos?: string[];
  reporter?: {
    isGuest?: boolean;
    firstName?: string;
    lastName?: string;
    contactNo?: string;
    barangay?: string;
    municipality?: string;
    country?: string;
    postalCode?: string;
  };
};
