import type { NextFunction, Request, Response } from "express";
import { AUDIT_EVENT } from "../features/audit/audit.constants";
import { logSecurityEvent } from "../features/audit/audit.service";
import { deriveRoleProfileKey, getRolePermissions } from "../features/rbac/rbac.service";
import type { RbacPermission } from "../features/rbac/permissions.constants";
import { User } from "../features/users/user.model";

async function resolveRoleContext(req: Request) {
  const role = String((req as any).user?.role ?? req.role ?? "");

  if (role === "ADMIN") {
    if (!req.userId) return null;

    let adminTier = req.adminTier;
    let userPermissions = req.permissions;
    if (!adminTier || !Array.isArray(userPermissions)) {
      const user = await User.findById(req.userId).select("role adminTier permissions").lean();
      if (!user || user.role !== "ADMIN") return null;
      adminTier = user.adminTier ?? "CDRRMO";
      userPermissions = Array.isArray(user.permissions) ? user.permissions : [];
      req.adminTier = adminTier;
      req.permissions = userPermissions;
    }

    const roleKey = deriveRoleProfileKey({ role: "ADMIN", adminTier });
    if (!roleKey) return null;

    req.roleKey = roleKey;
    return {
      roleKey,
      userPermissions: userPermissions ?? [],
    };
  }

  const roleKey = deriveRoleProfileKey({ role });
  if (!roleKey) return null;

  req.roleKey = roleKey;
  return {
    roleKey,
    userPermissions: Array.isArray(req.permissions) ? req.permissions : [],
  };
}

export function requirePerm(permission: RbacPermission) {
  return async function requirePermMiddleware(req: Request, res: Response, next: NextFunction) {
    const roleContext = await resolveRoleContext(req);
    if (!roleContext) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const rolePermissions = await getRolePermissions(roleContext.roleKey);
    const hasPermission =
      rolePermissions.has(permission) ||
      roleContext.userPermissions.map((value) => String(value).trim()).includes(permission);

    if (!hasPermission) {
      void logSecurityEvent(req, AUDIT_EVENT.SECURITY_ACCESS_DENIED, "DENY", {
        permission,
        roleKey: roleContext.roleKey,
        path: req.originalUrl,
        method: req.method,
      });
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
}
