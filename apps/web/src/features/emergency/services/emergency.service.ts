import { api } from "../../../lib/api";
import type { EmergencyReport } from "../models/emergency.types";

export async function fetchEmergencyReports(limit = 200) {
  const res = await api.get<{ data: EmergencyReport[] }>("/api/emergencies/reports", {
    params: { limit },
  });
  return res.data.data;
}
