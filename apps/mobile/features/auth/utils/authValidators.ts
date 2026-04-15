import type { LoginRequest, SignupRequest } from "../models/auth.types";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include at least one letter and one number.";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function isNameValid(name: string) {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (trimmed.length < 2) return false;

  // Only letters + space + hyphen + apostrophe
  if (!/^[A-Za-z][A-Za-z\s'-]*$/.test(trimmed)) return false;

  // Must contain at least 2 letters total
  const lettersOnly = trimmed.replace(/[^A-Za-z]/g, "");
  return lettersOnly.length >= 2;
}

export function getPasswordChecks(password: string) {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    hasLetter: /[A-Za-z]/.test(password),
    hasNumber: /\d/.test(password),
  };
}

export function isPasswordPolicyValid(password: string) {
  const checks = getPasswordChecks(password);
  return checks.minLength && checks.hasLetter && checks.hasNumber;
}

export function validateLogin(payload: LoginRequest): string | null {
  const identifier = payload.identifier.trim();
  if (!identifier || !payload.password) return "Please enter your email/username and password.";
  if (identifier.includes("@") && !isEmailValid(identifier)) return "Please enter a valid email.";
  return null;
}

export function validateSignup(args: {
  payload: SignupRequest;
  confirmPassword: string;
  agree: boolean;
}): string | null {
  const { payload, confirmPassword, agree } = args;

  if (
    !payload.firstName.trim() ||
    !payload.lastName.trim() ||
    !payload.email.trim() ||
    !payload.password
  ) {
    return "Please fill in all fields.";
  }

  if (!isNameValid(payload.firstName)) {
    return "First name must be at least 2 letters and contain only letters (no numbers or special characters).";
  }

  if (!isNameValid(payload.lastName)) {
    return "Last name must be at least 2 letters and contain only letters (no numbers or special characters).";
  }

  if (!isEmailValid(payload.email)) return "Please enter a valid email.";
  if (!isPasswordPolicyValid(payload.password)) return PASSWORD_POLICY_MESSAGE;
  if (payload.password !== confirmPassword) return "Passwords do not match.";
  if (!agree) return "Please accept the Terms & Privacy Policy.";
  return null;
}
