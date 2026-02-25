import type { Request, Response } from "express";
import { routingRiskPredictSchema } from "./routingRisk.schema";
import { predictRoutingRiskCosts } from "./routingRisk.service";

type AuthedRequest = Request & { user?: { id: string; role?: string } };

export async function predict(req: AuthedRequest, res: Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const parsed = routingRiskPredictSchema.parse(req.body);
    const predictions = await predictRoutingRiskCosts(parsed.segments);

    return res.json({
      data: {
        routing_cost: predictions.map((item) => item.routing_cost),
        risk_level: predictions.map((item) => item.risk_level),
        recommended_speed_kph: predictions.map((item) => item.recommended_speed_kph),
        model_available: predictions.every((item) => item.model_available),
      },
    });
  } catch (err: any) {
    // zod errors
    if (err?.name === "ZodError") {
      return res.status(400).json({ message: "Invalid payload", details: err.errors });
    }
    return res.status(500).json({ message: err?.message ?? "Server error" });
  }
}
