import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../features/users/user.model";
import { AUDIT_EVENT } from "../features/audit/audit.constants";
import { logSecurityEvent } from "../features/audit/audit.service";

/**
 * Role-Based Access Control (RBAC) middleware.
 */
export function requireRole(...allowed: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (((req as any).user?.role ?? (req as any).role) as UserRole | undefined);

    if (!role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowed.includes(role)) {
      void logSecurityEvent(req, AUDIT_EVENT.SECURITY_ACCESS_DENIED, "DENY", {
        requiredRoles: allowed,
        actorRole: role,
        path: req.originalUrl,
        method: req.method,
      });
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
}
