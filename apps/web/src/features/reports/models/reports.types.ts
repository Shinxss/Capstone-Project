import type { EmergencyReport } from "../../emergency/models/emergency.types";
import type { DispatchTask } from "../../tasks/models/tasks.types";

export type ReportsFilters = {
  dateFrom: string;
  dateTo: string;
  emergencyType: string;
  status: string;
};

export type ReportTrend = {
  value: number;
  direction: "up" | "down" | "neutral";
  label: string;
  isPositive?: boolean;
};

export type ReportMetric = {
  key: "total" | "responded" | "unresolved" | "responseTime" | "volunteerHours";
  label: string;
  value: string;
  trend?: ReportTrend;
};

export type IncidentTrendPoint = {
  key: string;
  label: string;
  count: number;
};

export type EmergencyBreakdownItem = {
  key: string;
  label: string;
  count: number;
  percent: number;
};

export type AffectedAreaItem = {
  label: string;
  count: number;
  percentOfMax: number;
};

export type ResponsePerformance = {
  total: number;
  responded: number;
  resolved: number;
  unresolved: number;
  responseRate: number;
  resolvedRate: number;
  unresolvedRate: number;
  averageResponseMinutes: number | null;
  fastestResponseMinutes: number | null;
  slowestResponseMinutes: number | null;
};

export type GeneratedReport = {
  id: string;
  name: string;
  type: "Monthly" | "Quarterly";
  generatedOn: string;
  status: "completed";
};

export type ReportInsight = {
  id: string;
  title: string;
  description: string;
  tone: "danger" | "warning" | "info" | "success";
};

export type ReportsData = {
  emergencies: EmergencyReport[];
  tasks: DispatchTask[];
};

export type ReportsDashboard = {
  metrics: ReportMetric[];
  incidentTrend: IncidentTrendPoint[];
  responsePerformance: ResponsePerformance;
  emergencyBreakdown: EmergencyBreakdownItem[];
  affectedAreas: AffectedAreaItem[];
  generatedReports: GeneratedReport[];
  insights: ReportInsight[];
};
