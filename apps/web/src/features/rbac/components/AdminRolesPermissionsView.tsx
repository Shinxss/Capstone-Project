import { useEffect, useMemo, useState } from "react";
import type { useAdminRolesPermissions } from "../hooks/useAdminRolesPermissions";
import type { RoleKey } from "../models/rbac.types";

type Props = ReturnType<typeof useAdminRolesPermissions>;

function groupPermissionsByCategory(perms: string[]) {
  const grouped = new Map<string, string[]>();
  for (const permission of perms) {
    const [category = "misc"] = permission.split(".");
    const existing = grouped.get(category) ?? [];
    existing.push(permission);
    grouped.set(category, existing);
  }
  return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export default function AdminRolesPermissionsView({ roles, catalog, loading, error, busyRole, refresh, saveRolePermissions }: Props) {
  const [selectedRole, setSelectedRole] = useState<RoleKey>("SUPER_ADMIN");
  const currentRole = useMemo(() => roles.find((role) => role.key === selectedRole), [roles, selectedRole]);
  const [draftPermissions, setDraftPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (currentRole) {
      setDraftPermissions(currentRole.permissions);
    }
  }, [currentRole]);

  const groupedCatalog = useMemo(() => groupPermissionsByCategory(catalog), [catalog]);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        {roles.map((role) => (
          <button
            key={role.key}
            type="button"
            onClick={() => {
              setSelectedRole(role.key);
              setDraftPermissions(role.permissions);
            }}
            className={[
              "rounded-md border px-3 py-1.5 text-sm font-semibold transition",
              selectedRole === role.key
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]",
            ].join(" ")}
          >
            {role.label}
          </button>
        ))}

        <button
          type="button"
          onClick={() => void refresh()}
          className="ml-auto rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-200 dark:hover:bg-[#122036]"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-300">
          Loading roles...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {!loading && !error && currentRole ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0B1220]">
          <div className="mb-3 text-sm font-semibold text-gray-700 dark:text-slate-200">
            Editing: {currentRole.label} ({currentRole.key})
          </div>

          <div className="space-y-4">
            {groupedCatalog.map(([category, permissions]) => (
              <div key={category} className="rounded-md border border-gray-200 p-3 dark:border-[#162544]">
                <div className="mb-2 text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">{category}</div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {permissions.map((permission) => {
                    const checked = draftPermissions.includes(permission);
                    return (
                      <label key={permission} className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            setDraftPermissions((prev) => {
                              if (event.target.checked) {
                                return Array.from(new Set([...prev, permission]));
                              }
                              return prev.filter((value) => value !== permission);
                            });
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <span>{permission}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => void saveRolePermissions(currentRole.key, draftPermissions)}
              disabled={busyRole === currentRole.key}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {busyRole === currentRole.key ? "Saving..." : "Save permissions"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
