import type { DispatchTask } from "../../models/tasks.types";

export type CompletedTask = DispatchTask;

export type CompletedTaskSort =
  | "COMPLETED_NEWEST"
  | "COMPLETED_OLDEST"
  | "VERIFIED_NEWEST"
  | "VOLUNTEER_NAME"
  | "EMERGENCY_TYPE";

export type CompletedTaskStatistics = {
  totalCompleted: number;
  verifiedToday: number;
  averageResponseTimeMs: number | null;
  completionRate: number | null;
};

export type PaginationMetadata = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  firstItem: number;
  lastItem: number;
};

export type TaskStatusCounts = {
  all: number | null;
  inProgress: number | null;
  forReview: number | null;
  completed: number;
  canceled: number | null;
};
