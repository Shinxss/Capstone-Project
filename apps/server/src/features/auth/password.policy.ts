import { z } from "zod";

export const PASSWORD_MIN_LEN = 8;
export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;
export const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include at least one letter and one number.";

export function zodPasswordSchema() {
  return z
    .string()
    .min(PASSWORD_MIN_LEN, PASSWORD_POLICY_MESSAGE)
    .regex(PASSWORD_PATTERN, PASSWORD_POLICY_MESSAGE);
}

export function isStrongPassword(value: string) {
  return value.length >= PASSWORD_MIN_LEN && PASSWORD_PATTERN.test(value);
}
