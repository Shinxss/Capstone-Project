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

export type DispatchStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "CANCELLED"
  | "DONE"
  | "VERIFIED";

export type DispatchProof = {
  url: string;
  uploadedAt: string;
  mimeType?: string;
  fileName?: string;
  fileHash?: string;
};

export type DispatchLastKnownLocation = {
  lng: number;
  lat: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  at?: string | null;
};

export type DispatchChainRecord = {
  network?: string;
  contractAddress?: string;
  txHash?: string;
  blockNumber?: number;
  taskIdHash?: string;
  payloadHash?: string;
  recordHash?: string | null;
  recordedAt?: string;
  revoked?: boolean;
};

export type DispatchBlockchainRecord = {
  network?: string;
  contractAddress?: string;
  schemaVersion?: string;
  domain?: string;
  taskIdHash?: string;
  payloadHash?: string;
  verifiedTxHash?: string;
  verifiedAtBlockTime?: string;
  verifierAddress?: string;
  revoked?: boolean;
  revokedReasonHash?: string;
  revokedTxHash?: string;
  revokedAtBlockTime?: string;
  reverifiedTxHash?: string;
};

export type DispatchOffer = {
  id: string;
  status: DispatchStatus;
  createdAt?: string;
  updatedAt?: string;
  respondedAt?: string | null;
  completedAt?: string | null;
  verifiedAt?: string | null;
  proofs?: DispatchProof[];
  proofFileHashes?: string[];
  chainRecord?: DispatchChainRecord | null;
  blockchain?: DispatchBlockchainRecord | null;
  lastKnownLocation?: DispatchLastKnownLocation | null;
  lastKnownLocationAt?: string | null;
  emergency: DispatchEmergency;
};
