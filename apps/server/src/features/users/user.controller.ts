import type { Request, Response } from "express";
import * as userService from "./user.service";

type AuthedRequest = Request & { user?: { id: string; role?: string } };

export async function listVolunteers(req: AuthedRequest, res: Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const role = String(req.user.role ?? "");
    if (!role || !["LGU", "ADMIN"].includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const onlyApproved = String(req.query.onlyApproved ?? "true") !== "false";
    const includeInactive = String(req.query.includeInactive ?? "true") !== "false";

    const items = await userService.listDispatchVolunteers({
      onlyApproved,
      includeInactive,
    });

    return res.json({ data: items });
  } catch (err: any) {
    return res.status(500).json({ message: err?.message ?? "Server error" });
  }
}
