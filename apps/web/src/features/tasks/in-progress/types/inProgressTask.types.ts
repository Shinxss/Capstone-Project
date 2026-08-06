import type { DispatchTask, TaskEmergency } from "../../models/tasks.types";

export type InProgressPriority = "HIGH" | "MEDIUM" | "LOW" | "UNSPECIFIED";
export type InProgressPriorityFilter = InProgressPriority | "ALL";
export type InProgressSort =
  | "LAST_UPDATED"
  | "REPORTED_NEWEST"
  | "REPORTED_OLDEST"
  | "PRIORITY"
  | "EMERGENCY_TYPE"
  | "RESPONDER_COUNT";

export type InProgressTaskFilters = {
  emergencyType: string;
  barangay: string;
  priority: InProgressPriorityFilter;
  responder: string;
};

export type InProgressTaskGroup = {
  id: string;
  emergency: TaskEmergency;
  offers: DispatchTask[];
  priority: InProgressPriority;
  reportedAt: string | null;
  updatedAt: string | null;
  updatedAtMs: number;
  awaitingUpdate: boolean;
};

export type InProgressTaskStatistics = {
  activeEmergencies: number;
  respondersEnRoute: number;
  awaitingUpdate: number;
  averageArrivalTimeMs: number | null;
};

export type InProgressPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startItem: number;
  endItem: number;
};

export type InProgressFilterOptions = {
  emergencyTypes: string[];
  barangays: string[];
};
