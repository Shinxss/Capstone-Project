import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../features/users/user.model";

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
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
}
