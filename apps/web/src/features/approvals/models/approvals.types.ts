export type EmergencyVerificationFilters = {
  q: string;
  emergencyType: string; // "ALL" or specific
  barangay: string;
  dateFrom: string; // YYYY-MM-DD or ""
  dateTo: string; // YYYY-MM-DD or ""
};

export type EmergencyApprovalStatus = "pending" | "approved" | "rejected" | "not_required";

export type EmergencyApprovalItem = {
  incidentId: string;
  referenceNumber: string;
  type: string;
  barangay: string;
  locationLabel?: string;
  createdAt: string;
  reporter: {
    id?: string;
    name: string;
    role?: string;
    isGuest: boolean;
  };
};

