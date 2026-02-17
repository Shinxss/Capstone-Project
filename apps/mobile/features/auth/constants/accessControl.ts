export const TASKS_GUARD_MODE: "modal" | "redirect" = "modal";
// Set to "redirect" if you want direct navigation to login instead of showing a modal.

const TASKS_ALLOWED_ROLES = new Set(["VOLUNTEER", "LGU", "CDRRMO"]);

export function isTasksRoleAllowed(role: string | undefined): boolean {
  if (!role) return false;
  return TASKS_ALLOWED_ROLES.has(role.trim().toUpperCase());
}
