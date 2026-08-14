import type {
  GuestEmergencyContactErrors,
  GuestEmergencyContactInput,
} from "../models/guestEmergencyContact.types";

const PH_MOBILE_PATTERN = /^\+639\d{9}$/;

export function normalizeGuestFullName(value: string): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function normalizePhilippineMobileNumber(value: string): string | null {
  const compact = String(value ?? "").trim().replace(/[\s()-]/g, "");
  const normalized = /^09\d{9}$/.test(compact)
    ? `+63${compact.slice(1)}`
    : compact;

  return PH_MOBILE_PATTERN.test(normalized) ? normalized : null;
}

export function validateGuestEmergencyContact(
  input: GuestEmergencyContactInput
): {
  value: GuestEmergencyContactInput | null;
  errors: GuestEmergencyContactErrors;
} {
  const fullName = normalizeGuestFullName(input.fullName);
  const phoneNumber = normalizePhilippineMobileNumber(input.phoneNumber);
  const errors: GuestEmergencyContactErrors = {};

  if (fullName.length < 2) {
    errors.fullName = "Enter your full name (at least 2 characters).";
  } else if (fullName.length > 80) {
    errors.fullName = "Full name must be 80 characters or less.";
  }

  if (!phoneNumber) {
    errors.phoneNumber = "Enter a valid PH mobile number (09XXXXXXXXX or +639XXXXXXXXX).";
  }

  return {
    value: Object.keys(errors).length ? null : { fullName, phoneNumber: phoneNumber! },
    errors,
  };
}

export function isValidGuestEmergencyContact(value: unknown): value is GuestEmergencyContactInput {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GuestEmergencyContactInput>;
  return Boolean(
    validateGuestEmergencyContact({
      fullName: String(candidate.fullName ?? ""),
      phoneNumber: String(candidate.phoneNumber ?? ""),
    }).value
  );
}

export function formatPhilippineMobileNumber(value: string): string {
  const normalized = normalizePhilippineMobileNumber(value);
  if (!normalized) return String(value ?? "").trim();
  return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6, 9)} ${normalized.slice(9)}`;
}
