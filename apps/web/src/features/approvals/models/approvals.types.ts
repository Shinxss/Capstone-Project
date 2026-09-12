export type EmergencyVerificationFilters = {
  q: string;
  emergencyType: string; // "ALL" or specific
  barangay: string;
  dateFrom: string; // YYYY-MM-DD or ""
  dateTo: string; // YYYY-MM-DD or ""
  status: "ALL" | EmergencyApprovalStatus;
  sort: "LATEST" | "OLDEST" | "SEVERITY";
};

export type EmergencyApprovalStatus = "pending" | "approved" | "rejected" | "not_required";
export type EmergencyApprovalSeverity = "high" | "medium" | "low";

export type PendingEmergencyApproval = {
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

export type EmergencyApprovalItem = {
  incidentId: string;
  referenceNumber: string;
  type: string;
  title: string;
  barangay: string;
  locationLabel?: string;
  description: string;
  createdAt: string;
  reportedAt?: string;
  updatedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  status: EmergencyApprovalStatus;
  severity: EmergencyApprovalSeverity;
  photos: string[];
  coordinates?: [number, number];
  reporter: {
    id?: string;
    name: string;
    role?: string;
    isGuest: boolean;
    email?: string;
    phone?: string;
    avatarUrl?: string;
  };
};

export type EmergencyApprovalDetailResponse = {
  incidentId: string;
  referenceNumber: string;
  isSos: boolean;
  type: string;
  status: string;
  verificationStatus: EmergencyApprovalStatus;
  isVisibleOnMap: boolean;
  location?: {
    coords?: {
      latitude?: number;
      longitude?: number;
    };
    label?: string;
  };
  description?: string;
  photos?: string[];
  reporter?: {
    id?: string;
    isGuest?: boolean;
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    role?: string;
    lifelineId?: string;
    avatarUrl?: string;
    contactNo?: string;
    reporterLabel?: string;
  };
  reportedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};
