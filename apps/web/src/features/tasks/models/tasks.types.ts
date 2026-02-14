export type TaskProof = {
  url: string;
  uploadedAt: string;
  mimeType?: string;
  fileName?: string;
};

export type TaskChainRecord = {
  network: string;
  contractAddress: string;
  txHash: string;
  blockNumber?: number;
  recordHash: string;
  recordedAt: string;
};

export type TaskVolunteer = {
  id: string;
  name: string;
};

export type TaskEmergency = {
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

export type DispatchTask = {
  id: string;
  status: string;
  respondedAt?: string | null;
  completedAt?: string | null;
  verifiedAt?: string | null;
  chainRecord?: TaskChainRecord | null;
  proofs?: TaskProof[];
  volunteer?: TaskVolunteer | null;
  emergency: TaskEmergency;
  createdAt?: string;
  updatedAt?: string;
};
