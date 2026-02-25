import { z } from "zod";

export const MAX_ROUTE_CANDIDATES = 3;
export const MAX_STEPS_PER_ROUTE = 1000;

const coordinateSchema = z
  .object({
    lng: z.number().finite().min(-180).max(180),
    lat: z.number().finite().min(-90).max(90),
  })
  .strict();

const weatherSchema = z
  .object({
    rainfall_mm: z.number().finite().min(0).default(0),
    is_raining: z.union([z.literal(0), z.literal(1)]).default(0),
  })
  .strict();

export const optimizeRouteSchema = z
  .object({
    start: coordinateSchema,
    end: coordinateSchema,
    profile: z.enum(["driving", "walking"]).default("driving"),
    mode: z.enum(["optimize", "evaluate"]).default("optimize"),
    weather: weatherSchema.optional(),
  })
  .strict();

export type OptimizeRouteInput = z.infer<typeof optimizeRouteSchema>;
