export type GeoPoint = {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
  accuracy?: number;
};

export type Reporter = {
  _id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  role?: string;
  lifelineId?: string;
  avatarUrl?: string;
  contactNo?: string;
  barangay?: string;
  municipality?: string;
  country?: string;
  postalCode?: string;
};

export type EmergencyReport = {
  _id: string;
  emergencyType: string;
  source: string;
  status: string;
  progressLabel?: "Submitted" | "Assigned" | "En Route" | "Arrived" | "Resolved" | "Cancelled";
  progressPercent?: number;
  location: GeoPoint;
  notes?: string;
  reportedBy?: Reporter | string;
  reportedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  barangayName?: string | null;
  barangayCity?: string | null;
  barangayProvince?: string | null;
  photos?: string[];
  locationLabel?: string;
  referenceNumber?: string;
  reporterIsGuest?: boolean;
};
