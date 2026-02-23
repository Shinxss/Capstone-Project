import type { NextFunction, Request, Response } from "express";
import { User } from "../features/users/user.model";

export type RequiredAdminTier = "SUPER" | "CDRRMO";

export function requireAdminTier(...allowedTiers: RequiredAdminTier[]) {
  return async function requireAdminTierMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.role !== "ADMIN" || !req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const user = await User.findById(req.userId).select("role adminTier").lean();
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const adminTier = user.adminTier ?? "CDRRMO";
    if (!allowedTiers.includes(adminTier)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    req.adminTier = adminTier;
    return next();
  };
}
