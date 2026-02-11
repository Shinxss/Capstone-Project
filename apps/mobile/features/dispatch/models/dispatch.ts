export type DispatchEmergency = {
  id: string;
  emergencyType: string;
  source: string;
  status: string;
  lng: number;
  lat: number;
  notes?: string | null;
  reportedAt?: string;
  barangayName?: string | null;
};

export type DispatchProof = {
  url: string;
  uploadedAt: string;
  mimeType?: string;
  fileName?: string;
};

export type DispatchOffer = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "DONE" | "VERIFIED";
  createdAt?: string;
  respondedAt?: string | null;
  completedAt?: string | null;
  verifiedAt?: string | null;
  proofs?: DispatchProof[];
  emergency: DispatchEmergency;
};
