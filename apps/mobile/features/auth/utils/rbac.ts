export type AppRole = "ADMIN" | "LGU" | "VOLUNTEER" | "COMMUNITY";

/** UI-only RBAC helper (backend RBAC still required). */
export function can(role: AppRole | undefined | null, allowed: AppRole[]) {
  if (!role) return false;
  return allowed.includes(role);
}
