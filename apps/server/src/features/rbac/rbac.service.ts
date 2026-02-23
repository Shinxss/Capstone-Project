import { RoleProfile, type RoleProfileKey } from "./role.model";
import { RBAC_PERMISSIONS } from "./permissions.constants";

const CACHE_TTL_MS = 60_000;
const VALID_PERMISSION_SET = new Set<string>(RBAC_PERMISSIONS);

const defaultRoleProfiles: Record<RoleProfileKey, { label: string; permissions: string[] }> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    permissions: [...RBAC_PERMISSIONS],
  },
  CDRRMO_ADMIN: {
    label: "CDRRMO Admin",
    permissions: [
      "users.view",
      "users.manage_volunteers",
      "barangays.view",
      "masterdata.view",
      "dispatch.view",
      "dispatch.create",
      "dispatch.reassign",
      "tasks.verify",
      "reports.view",
      "reports.verify",
      "reports.update",
      "analytics.view",
      "analytics.export",
      "audit.view",
      "audit.export",
      "announcements.manage",
      "settings.edit",
    ],
  },
  LGU_ADMIN: {
    label: "LGU Admin",
    permissions: [
      "users.view",
      "users.manage_volunteers",
      "barangays.view",
      "dispatch.view",
      "dispatch.create",
      "dispatch.reassign",
      "tasks.verify",
      "reports.view",
      "reports.verify",
      "reports.update",
      "analytics.view",
      "audit.view",
    ],
  },
};

const rolePermCache = new Map<RoleProfileKey, { expiresAt: number; permissions: Set<string> }>();

function normalizePermissions(permissions: string[]) {
  return Array.from(
    new Set(
      (permissions ?? [])
        .map((permission) => String(permission).trim())
        .filter((permission) => permission && VALID_PERMISSION_SET.has(permission))
    )
  );
}

function getCachedPermissions(roleKey: RoleProfileKey) {
  const now = Date.now();
  const cached = rolePermCache.get(roleKey);
  if (cached && cached.expiresAt > now) {
    return cached.permissions;
  }

  if (cached) {
    rolePermCache.delete(roleKey);
  }

  return null;
}

function setCachedPermissions(roleKey: RoleProfileKey, permissions: string[]) {
  rolePermCache.set(roleKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    permissions: new Set(normalizePermissions(permissions)),
  });
}

export function invalidateRolePermissionsCache(roleKey?: RoleProfileKey) {
  if (roleKey) {
    rolePermCache.delete(roleKey);
    return;
  }

  rolePermCache.clear();
}

export async function seedDefaultRoleProfiles(options?: { overwritePermissions?: boolean }) {
  const overwritePermissions = options?.overwritePermissions === true;
  const operations = (Object.keys(defaultRoleProfiles) as RoleProfileKey[]).map((roleKey) => {
    const defaults = defaultRoleProfiles[roleKey];

    if (overwritePermissions) {
      return {
        updateOne: {
          filter: { key: roleKey },
          update: {
            $set: {
              label: defaults.label,
              permissions: defaults.permissions,
            },
          },
          upsert: true,
        },
      };
    }

    return {
      updateOne: {
        filter: { key: roleKey },
        update: {
          $setOnInsert: {
            key: roleKey,
            permissions: defaults.permissions,
          },
          $set: {
            label: defaults.label,
          },
        },
        upsert: true,
      },
    };
  });

  await RoleProfile.bulkWrite(operations, { ordered: false });
  invalidateRolePermissionsCache();
}

export async function getRolePermissions(roleKey: RoleProfileKey): Promise<Set<string>> {
  const cached = getCachedPermissions(roleKey);
  if (cached) return cached;

  const roleProfile = await RoleProfile.findOne({ key: roleKey }).select("permissions").lean();
  if (!roleProfile) {
    await seedDefaultRoleProfiles();
    const fallbackRoleProfile = await RoleProfile.findOne({ key: roleKey }).select("permissions").lean();
    const permissions = normalizePermissions(fallbackRoleProfile?.permissions ?? []);
    setCachedPermissions(roleKey, permissions);
    return new Set(permissions);
  }

  const permissions = normalizePermissions(roleProfile.permissions ?? []);
  setCachedPermissions(roleKey, permissions);
  return new Set(permissions);
}

export function deriveRoleProfileKey(input: { role?: string; adminTier?: string }): RoleProfileKey | null {
  if (input.role === "ADMIN") {
    return input.adminTier === "SUPER" ? "SUPER_ADMIN" : "CDRRMO_ADMIN";
  }

  if (input.role === "LGU") {
    return "LGU_ADMIN";
  }

  return null;
}

export async function listRoleProfiles() {
  return RoleProfile.find({}).sort({ key: 1 }).lean();
}

export async function updateRoleProfilePermissions(roleKey: RoleProfileKey, permissions: string[]) {
  const normalized = normalizePermissions(permissions);

  const updated = await RoleProfile.findOneAndUpdate(
    { key: roleKey },
    {
      $set: {
        permissions: normalized,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  ).lean();

  invalidateRolePermissionsCache(roleKey);
  return updated;
}

export function getDefaultRoleProfiles() {
  return defaultRoleProfiles;
}
