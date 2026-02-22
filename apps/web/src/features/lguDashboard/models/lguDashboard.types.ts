import type { EmergencyType } from "../../emergency/constants/emergency.constants";

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

export type DashboardEmergencyItem = {
  id: string;
  type: EmergencyType;
  status: string;
  lng: number;
  lat: number;
  notes?: string;
  reportedAt?: string;
  reporterName?: string;

  barangayName?: string | null;
  barangayCity?: string | null;

};
