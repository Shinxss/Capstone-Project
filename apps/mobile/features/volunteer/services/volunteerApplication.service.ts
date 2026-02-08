import { api } from "../../../lib/api";

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
};
