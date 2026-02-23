import { api } from "@/lib/api";
import type { RoleKey, RoleProfile } from "../models/rbac.types";

export async function fetchRoleProfiles() {
  const res = await api.get<{ items: RoleProfile[] }>("/api/admin/rbac/roles");
  return res.data.items ?? [];
}

export async function fetchPermissionCatalog() {
  const res = await api.get<{ items: string[] }>("/api/admin/rbac/perms");
  return res.data.items ?? [];
}

export async function updateRolePermissions(roleKey: RoleKey, permissions: string[]) {
  const res = await api.patch<{ item: RoleProfile }>(`/api/admin/rbac/roles/${roleKey}`, { permissions });
  return res.data.item;
}
