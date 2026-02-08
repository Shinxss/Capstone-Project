export type VolunteerApplicationStatus =
  | "pending_verification"
  | "needs_info"
  | "verified"
  | "rejected";

export type Sex = "Male" | "Female" | "Prefer not to say";

export type VolunteerApplication = {
  _id: string;
  userId: string;

  fullName: string;
  sex: Sex;
  birthdate: string;

  mobile: string;
  email?: string;

  street?: string;
  barangay: string;
  city?: string;
  province?: string;

  emergencyContact: {
    name: string;
    relationship: string;
    mobile: string;
    addressSameAsApplicant?: boolean;
    address?: string;
  };

  skillsOther?: string;
  certificationsText?: string;
  availabilityText?: string;
  preferredAssignmentText?: string;
  healthNotes?: string;

  consent: { truth: boolean; rules: boolean; data: boolean };

  status: VolunteerApplicationStatus;

  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;

  createdAt?: string;
  updatedAt?: string;
};

export type VolunteerApplicationListResponse = {
  items: VolunteerApplication[];
  total: number;
  page: number;
  limit: number;
};
