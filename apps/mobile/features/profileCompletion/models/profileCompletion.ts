import type { AuthUser } from "../../auth/auth.types";
import {
  DAGUPAN_BARANGAY_OPTIONS,
  PROFILE_GENDER_OPTIONS,
} from "../../profile/constants/profileEdit.constants";

export type ProfileCompletionField = "firstName" | "lastName" | "contactNo" | "gender" | "barangay";

export type ProfileCompletionFormValues = {
  firstName: string;
  lastName: string;
  contactNo: string;
  gender: string;
  barangay: string;
};

export type ProfileCompletionFieldErrors = Partial<Record<ProfileCompletionField, string>>;

export type ProfileCompletionPayload = {
  firstName?: string;
  lastName?: string;
  contactNo: string;
  gender: (typeof PROFILE_GENDER_OPTIONS)[number];
  barangay: string;
  municipality?: string;
};

export type ProfileCompletionNameVisibility = {
  showFirstName: boolean;
  showLastName: boolean;
};

const ALLOWED_GENDER_SET = new Set<string>(PROFILE_GENDER_OPTIONS);
const PH_MOBILE_REGEX = /^(?:\+639\d{9}|09\d{9})$/;

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeMobileContact(value: string) {
  const compact = normalizeString(value).replace(/[\s\-()]/g, "");
  return PH_MOBILE_REGEX.test(compact) ? compact : null;
}

export function isValidMobileContact(value: string) {
  return normalizeMobileContact(value) !== null;
}

export function formatDagupanAddress(barangay: string) {
  const cleanedBarangay = normalizeString(barangay);
  if (!cleanedBarangay) return "";
  return `${cleanedBarangay}, Dagupan City, Pangasinan`;
}

export function getInitialProfileCompletionValues(user?: Partial<AuthUser> | null): ProfileCompletionFormValues {
  return {
    firstName: normalizeString(user?.firstName),
    lastName: normalizeString(user?.lastName),
    contactNo: normalizeString(user?.contactNo),
    gender: normalizeString(user?.gender),
    barangay: normalizeString(user?.barangay),
  };
}

function hasMissingField(user: Partial<AuthUser> | null | undefined, field: ProfileCompletionField) {
  const missingFields = Array.isArray(user?.missingProfileFields)
    ? user?.missingProfileFields.map((value) => normalizeString(value))
    : [];
  return missingFields.includes(field);
}

export function resolveProfileCompletionNameVisibility(user?: Partial<AuthUser> | null): ProfileCompletionNameVisibility {
  const authProvider = normalizeString(user?.authProvider);
  const firstName = normalizeString(user?.firstName);
  const lastName = normalizeString(user?.lastName);

  const showFirstName = authProvider === "google" || hasMissingField(user, "firstName") || firstName.length === 0;
  const showLastName = authProvider === "google" || hasMissingField(user, "lastName") || lastName.length === 0;

  return { showFirstName, showLastName };
}

export function validateProfileCompletionValues(
  values: ProfileCompletionFormValues,
  visibility: ProfileCompletionNameVisibility
): ProfileCompletionFieldErrors {
  const errors: ProfileCompletionFieldErrors = {};

  const firstName = normalizeString(values.firstName);
  if (visibility.showFirstName) {
    if (!firstName) {
      errors.firstName = "First name is required.";
    } else if (firstName.length > 100) {
      errors.firstName = "First name must be 100 characters or less.";
    }
  }

  const lastName = normalizeString(values.lastName);
  if (visibility.showLastName) {
    if (!lastName) {
      errors.lastName = "Last name is required.";
    } else if (lastName.length > 100) {
      errors.lastName = "Last name must be 100 characters or less.";
    }
  }

  const contactNo = normalizeString(values.contactNo);
  if (!contactNo) {
    errors.contactNo = "Phone number is required.";
  } else if (!isValidMobileContact(contactNo)) {
    errors.contactNo = "Use +639XXXXXXXXX or 09XXXXXXXXX.";
  }

  const gender = normalizeString(values.gender);
  if (!gender) {
    errors.gender = "Gender is required.";
  } else if (!ALLOWED_GENDER_SET.has(gender)) {
    errors.gender = "Select a valid gender.";
  }

  const barangay = normalizeString(values.barangay);
  if (!barangay) {
    errors.barangay = "Address is required.";
  } else if (!DAGUPAN_BARANGAY_OPTIONS.includes(barangay as (typeof DAGUPAN_BARANGAY_OPTIONS)[number])) {
    errors.barangay = "Select a valid Dagupan barangay.";
  }

  return errors;
}

export function hasValidationErrors(errors: ProfileCompletionFieldErrors) {
  return Object.keys(errors).length > 0;
}

export function buildProfileCompletionPayload(
  values: ProfileCompletionFormValues,
  visibility: ProfileCompletionNameVisibility
): ProfileCompletionPayload {
  const firstName = normalizeString(values.firstName);
  const lastName = normalizeString(values.lastName);

  const payload: ProfileCompletionPayload = {
    contactNo: normalizeMobileContact(values.contactNo) ?? normalizeString(values.contactNo),
    gender: normalizeString(values.gender) as (typeof PROFILE_GENDER_OPTIONS)[number],
    barangay: normalizeString(values.barangay),
    municipality: "Dagupan City",
  };

  if (visibility.showFirstName || firstName) {
    payload.firstName = firstName;
  }

  if (visibility.showLastName || lastName) {
    payload.lastName = lastName;
  }

  return payload;
}
