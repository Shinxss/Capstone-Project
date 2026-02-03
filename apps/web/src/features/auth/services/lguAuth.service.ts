import { api } from "../../../lib/api";
import { AUTH_ENDPOINTS } from "../constants/auth.constants";
import type { ApiEnvelope, LguLoginRequest, LguLoginResponse } from "../models/auth.types";

export async function lguLogin(payload: LguLoginRequest): Promise<LguLoginResponse> {
  const res = await api.post<ApiEnvelope<LguLoginResponse>>(AUTH_ENDPOINTS.lguLogin, payload);

  const accessToken = res.data?.data?.accessToken;
  if (!accessToken) {
    throw new Error(res.data?.error || "No token returned");
  }

  return { accessToken };
}
