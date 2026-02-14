import type { ReportsData } from "../models/reports.types";
import { fetchEmergencyReports } from "../../emergency/services/emergency.service";
import { fetchLguTasksByStatus } from "../../tasks/services/tasksApi";

export async function fetchReportsData(): Promise<ReportsData> {
  const [emergencies, tasks] = await Promise.all([
    fetchEmergencyReports(300),
    // Comma-separated status list is supported by backend (see server dispatch routes).
    fetchLguTasksByStatus("ACCEPTED,DONE,VERIFIED"),
  ]);

  return { emergencies, tasks };
}

