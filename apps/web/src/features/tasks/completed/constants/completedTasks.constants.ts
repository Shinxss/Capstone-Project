import type { CompletedTaskSort } from "../types/completedTask.types";

export const COMPLETED_TASKS_PAGE_SIZE = 8;

export const TASK_OVERVIEW_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "DECLINED",
  "DONE",
  "VERIFIED",
  "CANCELLED",
] as const;

export const COMPLETED_TASK_SORT_OPTIONS: ReadonlyArray<{
  value: CompletedTaskSort;
  label: string;
}> = [
  { value: "COMPLETED_NEWEST", label: "Completed: Newest" },
  { value: "COMPLETED_OLDEST", label: "Completed: Oldest" },
  { value: "VERIFIED_NEWEST", label: "Verified: Newest" },
  { value: "VOLUNTEER_NAME", label: "Volunteer Name" },
  { value: "EMERGENCY_TYPE", label: "Emergency Type" },
];
