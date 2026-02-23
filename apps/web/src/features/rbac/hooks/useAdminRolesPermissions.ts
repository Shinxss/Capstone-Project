import { useCallback, useEffect, useState } from "react";
import { toastError, toastSuccess } from "@/services/feedback/toast.service";
import type { RoleKey, RoleProfile } from "../models/rbac.types";
import { fetchPermissionCatalog, fetchRoleProfiles, updateRolePermissions } from "../services/rbac.service";

export function useAdminRolesPermissions() {
  const [roles, setRoles] = useState<RoleProfile[]>([]);
  const [catalog, setCatalog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyRole, setBusyRole] = useState<RoleKey | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [roleProfiles, perms] = await Promise.all([fetchRoleProfiles(), fetchPermissionCatalog()]);
      setRoles(roleProfiles);
      setCatalog(perms);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to load RBAC profiles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveRolePermissions = useCallback(async (roleKey: RoleKey, permissions: string[]) => {
    setBusyRole(roleKey);
    try {
      const updated = await updateRolePermissions(roleKey, permissions);
      setRoles((prev) => prev.map((role) => (role.key === roleKey ? updated : role)));
      toastSuccess("Role permissions updated.");
    } catch (err: any) {
      toastError(err?.response?.data?.message ?? err?.message ?? "Failed to update role permissions");
      throw err;
    } finally {
      setBusyRole(null);
    }
  }, []);

  return {
    roles,
    catalog,
    loading,
    error,
    busyRole,
    refresh,
    saveRolePermissions,
  };
}
