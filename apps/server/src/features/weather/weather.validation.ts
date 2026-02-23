import { z } from "zod";

export const weatherSummaryQuerySchema = z
  .object({
    lat: z.coerce.number().finite().min(-90).max(90),
    lng: z.coerce.number().finite().min(-180).max(180),
  })
  .strict();

export type WeatherSummaryQuery = z.infer<typeof weatherSummaryQuerySchema>;
