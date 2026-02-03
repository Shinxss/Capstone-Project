import { api } from "../../../lib/api";
import { AUTH_ENDPOINTS } from "../constants/auth.constants";
import type {
  ApiResult,
  LguLoginRequest,
  PortalLoginData,
  AdminMfaVerifyRequest,
  AdminMfaVerifyData,
} from "../models/auth.types";

export async function lguLogin(payload: LguLoginRequest): Promise<PortalLoginData> {
  const res = await api.post<ApiResult<PortalLoginData>>(AUTH_ENDPOINTS.lguLogin, payload);

  if (!res.data?.success) {
    throw new Error(res.data?.error || "Login failed");
  }

  const data = res.data?.data;
  if (!data) throw new Error("Login failed");

  return data;
}

export async function adminMfaVerify(payload: AdminMfaVerifyRequest): Promise<AdminMfaVerifyData> {
  const res = await api.post<ApiResult<AdminMfaVerifyData>>(AUTH_ENDPOINTS.adminMfaVerify, payload);

  if (!res.data?.success) {
    throw new Error(res.data?.error || "OTP verification failed");
  }

  const data = res.data?.data;
  if (!data?.accessToken) throw new Error("No token returned");

  return data;
}
