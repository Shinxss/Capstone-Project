import type { DispatchOffer } from "./dispatch";

export type TasksTabKey = "new_dispatch" | "active" | "awaiting_approval" | "completed";

export type TasksTabConfig = {
  key: TasksTabKey;
  label: string;
  emptyTitle: string;
  emptyDescription: string;
};

export type TasksTabItem = {
  key: TasksTabKey;
  label: string;
  count: number;
};

export type DispatchTaskGroups = Record<TasksTabKey, DispatchOffer[]>;
