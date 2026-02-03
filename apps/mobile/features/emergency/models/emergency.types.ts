export type EmergencyStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "CANCELLED";
export type EmergencySource = "SOS_BUTTON" | "REPORT_FORM" | "SMS_OFFLINE";
export type EmergencyType = "SOS" | "FIRE" | "FLOOD" | "EARTHQUAKE" | "MEDICAL" | "OTHER";

export type SosCreateRequest = {
  lat: number;
  lng: number;
  accuracy?: number;
  notes?: string;
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
