import type { DispatchStatus } from "../models/dispatch";
import type { TasksTabConfig, TasksTabKey } from "../models/dispatchTaskView";

export const TASKS_SCREEN_COPY = {
  title: "Tasks",
  subtitle: "Emergency Dispatch & Progress",
} as const;

export const DEFAULT_TASKS_TAB: TasksTabKey = "new_dispatch";

export const DAILY_FOCUS_GOALS = {
  respondedGoal: 5,
  volunteerHoursGoal: 4,
  completedGoal: 5,
} as const;

export const TASKS_TAB_CONFIG: TasksTabConfig[] = [
  {
    key: "new_dispatch",
    label: "New Dispatch",
    emptyTitle: "No new dispatch right now",
    emptyDescription: "You will see new PENDING assignments here.",
  },
  {
    key: "active",
    label: "Active",
    emptyTitle: "No active task",
    emptyDescription: "Accepted dispatches appear here while in progress.",
  },
  {
    key: "awaiting_approval",
    label: "Awaiting Approval",
    emptyTitle: "Nothing awaiting review",
    emptyDescription: "DONE tasks appear here while waiting for LGU verification.",
  },
  {
    key: "completed",
    label: "Completed",
    emptyTitle: "No verified tasks yet",
    emptyDescription: "VERIFIED tasks will appear here once the backend exposes volunteer history.",
  },
];

export type DispatchBadgeTone = "pending" | "active" | "review" | "verified" | "neutral";

export const DISPATCH_BADGE_TONE_BY_STATUS: Partial<Record<DispatchStatus, DispatchBadgeTone>> = {
  PENDING: "pending",
  ACCEPTED: "active",
  DONE: "review",
  VERIFIED: "verified",
  DECLINED: "neutral",
  CANCELLED: "neutral",
};
