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
};

export type EmergencyReport = {
  _id: string;
  emergencyType: string;
  source: string;
  status: string;
  location: GeoPoint;
  notes?: string;
  reportedBy?: Reporter | string;
  reportedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};
