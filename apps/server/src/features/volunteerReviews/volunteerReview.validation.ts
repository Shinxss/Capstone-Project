import { z } from "zod";

export const upsertVolunteerReviewSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(500).optional(),
  })
  .strict();

export type UpsertVolunteerReviewInput = z.infer<typeof upsertVolunteerReviewSchema>;
