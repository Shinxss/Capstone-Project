import { z } from "zod";

export const routingRiskRowSchema = z
  .object({
    flood_depth_5yr: z.number().finite().min(0),
    rainfall_mm: z.number().finite().min(0),
    is_raining: z.union([z.literal(0), z.literal(1)]),
    bridge: z.union([z.literal(0), z.literal(1)]),
    road_priority: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  })
  .strict();

export const routingRiskPredictSchema = z
  .object({
    segments: z.array(routingRiskRowSchema).min(1).max(1000),
  })
  .strict();

export type RoutingRiskRow = z.infer<typeof routingRiskRowSchema>;