import type { Request, Response } from "express";
import type { OptimizeRouteInput } from "./routing.validation";
import { optimizeRoute } from "./routing.service";

type ControllerError = Error & { statusCode?: number; status?: number };

export async function postOptimizeRoute(req: Request, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = req.body as OptimizeRouteInput;
    const data = await optimizeRoute(payload);

    return res.json({ data });
  } catch (error) {
    const err = error as ControllerError;
    const status =
      typeof err.statusCode === "number"
        ? err.statusCode
        : typeof err.status === "number"
          ? err.status
          : 500;

    const message = status >= 500 ? "Routing optimization failed." : err.message;
    return res.status(status).json({ message });
  }
}
