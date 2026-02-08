export type VolunteerApplicationStatus =
  | "draft"
  | "pending_verification"
  | "needs_info"
  | "verified"
  | "rejected";

export type Sex = "Male" | "Female" | "Prefer not to say";

export type VolunteerApplicationInput = {
  fullName: string;
  sex: Sex | "";
  birthdate: string; // YYYY-MM-DD

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

  consent: {
    truth: boolean;
    rules: boolean;
    data: boolean;
  };
};

export type VolunteerApplicationRecord = VolunteerApplicationInput & {
  _id: string;
  status: VolunteerApplicationStatus;
  createdAt: string;
  updatedAt: string;
};
