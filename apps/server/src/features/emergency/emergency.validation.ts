import { z } from "zod";

export const sosSchema = z
  .object({
    notes: z.string().max(2000).optional(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    accuracy: z.number().optional(),
  })
  .strict();

export const listReportsQuerySchema = z
  .object({
    status: z.string().optional(),
    source: z.string().optional(),

    // query params are strings → use coerce
    limit: z.coerce.number().int().min(1).max(500).optional().default(200),
    page: z.coerce.number().int().min(1).max(10000).optional().default(1),
  })
  .strict();
