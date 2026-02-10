export type DispatchStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";

export type DispatchEmergencySummary = {
  id: string;
  emergencyType: string;
  status: string;
  source?: string;
  lng: number;
  lat: number;
  notes?: string;
  reportedAt: string;
};

export type DispatchOffer = {
  id: string;
  status: DispatchStatus;
  dispatchedAt: string;
  respondedAt?: string;
  emergency: DispatchEmergencySummary;
};
