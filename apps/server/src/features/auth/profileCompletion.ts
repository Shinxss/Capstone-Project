export const PROFILE_COMPLETION_BASE_FIELDS = ["contactNo", "gender", "barangay"] as const;
export const PROFILE_COMPLETION_NAME_FIELDS = ["firstName", "lastName"] as const;

export const PROFILE_COMPLETION_ALLOWED_GENDERS = [
  "Male",
  "Female",
  "Prefer not to say",
] as const;

export type ProfileCompletionField =
  | (typeof PROFILE_COMPLETION_BASE_FIELDS)[number]
  | (typeof PROFILE_COMPLETION_NAME_FIELDS)[number];

const MOBILE_PROFILE_ROLES = new Set(["COMMUNITY", "VOLUNTEER", "RESPONDER"]);

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isBlank(value: unknown) {
  return asTrimmedString(value).length === 0;
}

function normalizeAuthProvider(value: unknown): "local" | "google" | "both" {
  const provider = asTrimmedString(value).toLowerCase();
  if (provider === "google") return "google";
  if (provider === "both") return "both";
  return "local";
}

function shouldEvaluateProfileCompletion(role: unknown) {
  const normalizedRole = asTrimmedString(role).toUpperCase();
  return MOBILE_PROFILE_ROLES.has(normalizedRole);
}

export type ProfileCompletionUserLike = {
  role?: string;
  authProvider?: string;
  firstName?: string;
  lastName?: string;
  contactNo?: string;
  gender?: string;
  barangay?: string;
};

export type ProfileCompletionStatus = {
  profileCompletionRequired: boolean;
  missingProfileFields: ProfileCompletionField[];
};

export function getProfileCompletionStatus(user: ProfileCompletionUserLike): ProfileCompletionStatus {
  if (!shouldEvaluateProfileCompletion(user.role)) {
    return {
      profileCompletionRequired: false,
      missingProfileFields: [],
    };
  }

  const requiredFields = new Set<ProfileCompletionField>(PROFILE_COMPLETION_BASE_FIELDS);
  const authProvider = normalizeAuthProvider(user.authProvider);

  if (authProvider === "google") {
    requiredFields.add("firstName");
    requiredFields.add("lastName");
  } else {
    if (isBlank(user.firstName)) requiredFields.add("firstName");
    if (isBlank(user.lastName)) requiredFields.add("lastName");
  }

  const missingProfileFields = Array.from(requiredFields).filter((field) => {
    if (field === "firstName") return isBlank(user.firstName);
    if (field === "lastName") return isBlank(user.lastName);
    if (field === "contactNo") return isBlank(user.contactNo);
    if (field === "gender") return isBlank(user.gender);
    return isBlank(user.barangay);
  });

  return {
    profileCompletionRequired: missingProfileFields.length > 0,
    missingProfileFields,
  };
}

export function normalizePhilippineMobileContact(input: unknown): string | null {
  const trimmed = asTrimmedString(input);
  if (!trimmed) return null;

  const compact = trimmed.replace(/[\s\-()]/g, "");

  if (/^\+639\d{9}$/.test(compact)) {
    return compact;
  }

  if (/^09\d{9}$/.test(compact)) {
    return compact;
  }

  return null;
}
