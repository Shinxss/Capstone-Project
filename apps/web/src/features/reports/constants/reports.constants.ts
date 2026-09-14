import type { ReportsFilters } from "../models/reports.types";

export const DEFAULT_REPORTS_FILTERS: ReportsFilters = {
  dateFrom: "",
  dateTo: "",
  emergencyType: "ALL",
  status: "ALL",
};

export const EMPTY_REPORT_MESSAGE = "No report data found for the selected filters.";

export const EMERGENCY_COLORS: Record<string, string> = {
  SOS: "#F43F5E",
  FLOOD: "#3B82F6",
  FIRE: "#F59E0B",
  MEDICAL: "#10B981",
  "ROAD ACCIDENT": "#8B5CF6",
  TYPHOON: "#2563EB",
  EARTHQUAKE: "#F97316",
  OTHER: "#94A3B8",
};

export const FALLBACK_EMERGENCY_COLORS = ["#06B6D4", "#6366F1", "#84CC16", "#D946EF"];
