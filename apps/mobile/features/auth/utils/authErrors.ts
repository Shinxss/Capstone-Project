import { isAxiosError } from "axios";
import type { ApiErrorShape } from "../models/auth.types";

export function getErrorMessage(err: unknown, fallback = "Something went wrong") {
  if (isAxiosError(err)) {
    const data = err.response?.data as ApiErrorShape | undefined;
    return data?.error || data?.message || err.message || fallback;
  }
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}

export function getSignupErrorMessage(err: unknown): string {
  if (!isAxiosError(err)) {
    return "We couldn't send the verification code. Please try again.";
  }

  if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
    return "The request took too long. Please try again.";
  }

  if (!err.response) {
    return "Unable to connect to Lifeline. Check your internet connection and try again.";
  }

  if (err.response.status === 409) {
    return "This email is already registered.";
  }

  const data = err.response.data as ApiErrorShape | undefined;
  const serverMessage = String(data?.error ?? data?.message ?? "").trim();
  if (err.response.status === 400 && serverMessage) return serverMessage;
  if (err.response.status === 429 && serverMessage) return serverMessage;

  return "We couldn't send the verification code. Please try again.";
}
