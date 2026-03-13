import { api } from "../../../lib/api";
import { normalizeEmail } from "../utils/authValidators";

export type SignupRequestOtpPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type OtpUserPayload = {
  id: string;
  lifelineId?: string;
  email: string;
  firstName: string;
  lastName?: string;
  role?: string;
  volunteerStatus?: string;
  birthdate?: string;
  contactNo?: string;
  barangay?: string;
  gender?: string;
  skills?: string;
  avatarUrl?: string;
  authProvider?: "local" | "google" | "both";
  emailVerified?: boolean;
  passwordSet?: boolean;
  googleLinked?: boolean;
};

export type SignupVerifyOtpResult = {
  accessToken?: string;
  user?: OtpUserPayload;
};

type ApiEnvelope<TData = unknown> = {
  success?: boolean;
  message?: string;
  data?: TData;
  resetToken?: string;
};

type SignupVerifyOtpData = {
  accessToken?: unknown;
  user?: unknown;
};

type OtpStatusResult = {
  success: boolean;
  message: string;
};

function parseOtpStatus(data: unknown, fallbackMessage: string): OtpStatusResult {
  const payload = (data ?? {}) as ApiEnvelope;
  return {
    success: Boolean(payload.success),
    message: typeof payload.message === "string" ? payload.message : fallbackMessage,
  };
}

function normalizeOtp(otp: string) {
  return otp.replace(/\D/g, "").slice(0, 6);
}

export async function signupRequestOtp(payload: SignupRequestOtpPayload) {
  const res = await api.post<ApiEnvelope>("/api/auth/signup", {
    ...payload,
    email: normalizeEmail(payload.email),
  });
  return parseOtpStatus(res.data, "OTP sent");
}

export async function signupVerifyOtp(email: string, otp: string): Promise<SignupVerifyOtpResult> {
  const res = await api.post<ApiEnvelope<SignupVerifyOtpData>>("/api/auth/signup/verify-otp", {
    email: normalizeEmail(email),
    otp: normalizeOtp(otp),
  });

  const accessToken = res.data?.data?.accessToken;
  const user = res.data?.data?.user;

  return {
    accessToken: typeof accessToken === "string" ? accessToken : undefined,
    user: (user as OtpUserPayload | undefined) ?? undefined,
  };
}

export async function signupResendOtp(email: string) {
  const res = await api.post<ApiEnvelope>("/api/auth/signup/resend-otp", { email: normalizeEmail(email) });
  return parseOtpStatus(res.data, "OTP sent");
}

export async function requestPasswordOtp(email: string) {
  const res = await api.post<ApiEnvelope>("/api/auth/password/forgot", { email: normalizeEmail(email) });
  return parseOtpStatus(res.data, "OTP sent");
}

export async function verifyPasswordOtp(email: string, otp: string) {
  const res = await api.post<ApiEnvelope<{ resetToken?: unknown }>>("/api/auth/password/verify-otp", {
    email: normalizeEmail(email),
    otp: normalizeOtp(otp),
  });

  const resetToken = res.data?.resetToken ?? res.data?.data?.resetToken;
  if (!resetToken || typeof resetToken !== "string") {
    throw new Error("No reset token returned.");
  }

  return { resetToken };
}

export async function resetPassword(
  email: string,
  resetToken: string,
  newPassword: string,
  confirmPassword: string
) {
  const res = await api.post<ApiEnvelope>("/api/auth/password/reset", {
    email: normalizeEmail(email),
    resetToken,
    newPassword,
    confirmPassword,
  });
  return parseOtpStatus(res.data, "Password reset successful");
}
