import type { InProgressTaskFilters, InProgressSort } from "../types/inProgressTask.types";

export const IN_PROGRESS_PAGE_SIZE = 6;
export const AWAITING_UPDATE_AFTER_MS = 15 * 60 * 1000;

export const EMPTY_IN_PROGRESS_FILTERS: InProgressTaskFilters = {
  emergencyType: "ALL",
  barangay: "ALL",
  priority: "ALL",
  responder: "",
};

export const IN_PROGRESS_SORT_OPTIONS: ReadonlyArray<{ value: InProgressSort; label: string }> = [
  { value: "LAST_UPDATED", label: "Last Updated" },
  { value: "REPORTED_NEWEST", label: "Reported: Newest" },
  { value: "REPORTED_OLDEST", label: "Reported: Oldest" },
  { value: "PRIORITY", label: "Priority" },
  { value: "EMERGENCY_TYPE", label: "Emergency Type" },
  { value: "RESPONDER_COUNT", label: "Responder Count" },
];
