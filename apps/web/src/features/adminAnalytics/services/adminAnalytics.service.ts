import { api } from "@/lib/api";
import type { AdminAnalyticsOverview } from "../models/adminAnalytics.types";

export async function fetchAdminAnalyticsOverview(range: "7d" | "30d") {
  const res = await api.get<AdminAnalyticsOverview>("/api/admin/analytics/overview", {
    params: { range },
  });
  return res.data;
}
