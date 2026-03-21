import type { EmergencyType } from "../../emergency/constants/emergency.constants";

export type DashboardTrendDirection = "up" | "down" | "neutral";
export type DashboardTrendTone = "good" | "bad" | "neutral";
export type DashboardTrendKind = "count" | "percentagePoints";

export type DashboardTrend = {
  value: number;
  display: string;
  direction: DashboardTrendDirection;
  tone: DashboardTrendTone;
  kind: DashboardTrendKind;
  comparisonLabel: string;
};

export type DashboardStatCardKey =
  | "activeEmergencies"
  | "availableVolunteers"
  | "tasksInProgress"
  | "responseRate";

export type DashboardStatCardItem = {
  key: DashboardStatCardKey;
  label: string;
  value: number;
  valueDisplay: string;
  trend: DashboardTrend;
};

export type DashboardStats = {
  total: number;
  active: number;
  open: number;
  acknowledged: number;
  resolved: number;
  availableVolunteers: number;
  totalVolunteers: number;
  tasksInProgress: number;
  pendingTasks: number;
  responseRate: number;
  respondedTasks: number;
  dispatchOffers: number;
};

export type DashboardOperationalStats = {
  availableVolunteers: number;
  totalVolunteers: number;
  tasksInProgress: number;
  pendingTasks: number;
  responseRate: number;
  respondedTasks: number;
  dispatchOffers: number;
};

export type DashboardScopeInfo = {
  key: string;
  type: "city" | "barangay";
  barangayName: string | null;
  municipality: string | null;
  label: string;
};

export type DashboardStatCardsApiResponse = {
  generatedAt: string;
  comparisonWindowHours: number;
  comparisonLabel: string;
  scope: DashboardScopeInfo;
  stats: {
    activeEmergencies: number;
    availableVolunteers: number;
    totalVolunteers: number;
    tasksInProgress: number;
    pendingTasks: number;
    responseRate: number;
    respondedTasks: number;
    dispatchOffers: number;
  };
  statCards: DashboardStatCardItem[];
};

export type DashboardEmergencyItem = {
  id: string;
  type: EmergencyType;
  status: string;
  progressLabel: "Submitted" | "Assigned" | "En Route" | "Arrived" | "Resolved" | "Cancelled";
  progressPercent: number;
  lng: number;
  lat: number;
  notes?: string;
  reportedAt?: string;
  reporterName?: string;

  barangayName?: string | null;
  barangayCity?: string | null;
};
