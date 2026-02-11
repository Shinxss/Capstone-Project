import type { UserRole } from "../models/auth.types";

/** UI-only RBAC helper (backend RBAC still required). */
export function can(role: UserRole | undefined | null, allowed: UserRole[]) {
  if (!role) return false;
  return allowed.includes(role);
}
