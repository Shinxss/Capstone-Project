export type EmergencyVerificationFilters = {
  q: string;
  emergencyType: string; // "ALL" or specific
  barangay: string;
  dateFrom: string; // YYYY-MM-DD or ""
  dateTo: string; // YYYY-MM-DD or ""
};

export type DispatchRejection = {
  dispatchId: string;
  reason: string;
  rejectedAt: string; // ISO
  actor?: string;
};

