import { api } from "../../../lib/api";
import type { EmergencyReport, SosCreateRequest } from "../models/emergency.types";

const EMERGENCY_BASE = "/api/emergencies";

export async function createSosReport(payload: SosCreateRequest): Promise<EmergencyReport> {
  const res = await api.post(`${EMERGENCY_BASE}/sos`, payload);
  const report = res.data?.data as EmergencyReport | undefined;
  if (!report) throw new Error("No report returned");
  return report;
}
