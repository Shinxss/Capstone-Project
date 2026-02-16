import { api } from "../../../lib/api";

export type SignupRequestOtpPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type OtpUserPayload = {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  role?: string;
  volunteerStatus?: string;
  authProvider?: "local" | "google" | "both";
  emailVerified?: boolean;
  passwordSet?: boolean;
  googleLinked?: boolean;
};

export type SignupVerifyOtpResult = {
  accessToken?: string;
  user?: OtpUserPayload;
};

export async function signupRequestOtp(payload: SignupRequestOtpPayload) {
  const res = await api.post("/api/auth/signup", payload);
  return {
    success: Boolean(res.data?.success),
    message: String(res.data?.message ?? "OTP sent"),
  };
}

export async function signupVerifyOtp(email: string, otp: string): Promise<SignupVerifyOtpResult> {
  const res = await api.post("/api/auth/signup/verify-otp", { email, otp });
  return {
    accessToken: typeof res.data?.data?.accessToken === "string" ? res.data.data.accessToken : undefined,
    user: res.data?.data?.user as OtpUserPayload | undefined,
  };
}

export async function signupResendOtp(email: string) {
  const res = await api.post("/api/auth/signup/resend-otp", { email });
  return {
    success: Boolean(res.data?.success),
    message: String(res.data?.message ?? "OTP sent"),
  };
}

export async function requestPasswordOtp(email: string) {
  const res = await api.post("/api/auth/password/forgot", { email });
  return {
    success: Boolean(res.data?.success),
    message: String(res.data?.message ?? "OTP sent"),
  };
}

export async function verifyPasswordOtp(email: string, otp: string) {
  const res = await api.post("/api/auth/password/verify-otp", { email, otp });
  const resetToken = res.data?.resetToken;
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
  const res = await api.post("/api/auth/password/reset", {
    email,
    resetToken,
    newPassword,
    confirmPassword,
  });
  return {
    success: Boolean(res.data?.success),
    message: String(res.data?.message ?? "Password reset successful"),
  };
}
