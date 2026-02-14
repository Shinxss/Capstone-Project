import type { EmergencyReport } from "../../emergency/models/emergency.types";
import type { DispatchTask } from "../../tasks/models/tasks.types";

export type ReportsFilters = {
  dateFrom: string; // YYYY-MM-DD or ""
  dateTo: string; // YYYY-MM-DD or ""
  emergencyType: string; // "ALL" or specific
};

export type ReportsSummary = {
  totalEmergencies: number;
  activeTasks: number;
  completedTasks: number;
  avgResponseMinutes: number | null;
};

export type ReportsData = {
  emergencies: EmergencyReport[];
  tasks: DispatchTask[];
};

