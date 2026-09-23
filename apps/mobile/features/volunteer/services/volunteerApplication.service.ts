import { api } from "../../../lib/api";
import type { VolunteerApplicationRecord } from "../models/volunteerApplication.model";

export const volunteerApplicationService = {
  async submit(payload: any) {
    try {
      // ✅ backend is mounted at /api
      const res = await api.post("/api/volunteer-applications", payload);
      return res.data;
    } catch (e: any) {
      console.log("❌ Volunteer submit failed:", {
        message: e?.message,
        status: e?.response?.status,
        data: e?.response?.data,
        url: (e?.config?.baseURL ?? "") + (e?.config?.url ?? ""),
      });
      throw e;
    }
  },

  async getLatest(): Promise<VolunteerApplicationRecord | null> {
    try {
      const res = await api.get<VolunteerApplicationRecord>("/api/volunteer-applications/me/latest");
      return res.data ?? null;
    } catch (e: any) {
      if (e?.response?.status === 404) {
        return null;
      }
      console.log("❌ Failed to fetch latest volunteer application:", {
        message: e?.message,
        status: e?.response?.status,
        data: e?.response?.data,
      });
      throw e;
    }
  },
};
