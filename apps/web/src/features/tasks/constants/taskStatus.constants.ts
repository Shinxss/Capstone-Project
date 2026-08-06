export type TaskStatusTabKey = "all" | "inProgress" | "forReview" | "completed" | "canceled";

export const TASK_STATUS_TABS: ReadonlyArray<{
  key: TaskStatusTabKey;
  label: string;
  to: string;
}> = [
  { key: "all", label: "All", to: "/lgu/tasks" },
  { key: "inProgress", label: "In Progress", to: "/lgu/tasks/in-progress" },
  { key: "forReview", label: "For Review", to: "/lgu/tasks/for-review" },
  { key: "completed", label: "Completed", to: "/lgu/tasks/completed" },
  { key: "canceled", label: "Canceled", to: "/lgu/tasks/canceled" },
];
