import type { LoginRequest, SignupRequest } from "../models/auth.types";

function isEmailValid(email: string) {
  // simple + practical
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
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

  if (!payload.firstName.trim() || !payload.lastName.trim() || !payload.email.trim() || !payload.password) {
    return "Please fill in all fields.";
  }
  if (!isEmailValid(payload.email)) return "Please enter a valid email.";
  if (payload.password.length < 6) return "Password must be at least 6 characters.";
  if (payload.password !== confirmPassword) return "Passwords do not match.";
  if (!agree) return "Please accept the Terms & Privacy Policy.";
  return null;
}
