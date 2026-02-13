import type { LoginRequest, SignupRequest } from "../models/auth.types";

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
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

export function validateLogin(payload: LoginRequest): string | null {
  if (!payload.email.trim() || !payload.password) return "Please enter email and password.";
  if (!isEmailValid(payload.email)) return "Please enter a valid email.";
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
  if (payload.password.length < 8) return "Password must be at least 8 characters.";
  if (payload.password !== confirmPassword) return "Passwords do not match.";
  if (!agree) return "Please accept the Terms & Privacy Policy.";
  return null;
}
