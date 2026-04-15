import { z } from "zod";
import { objectIdSchema } from "../responders/responder.validation";

const booleanQuerySchema = z.enum(["true", "false"]);

export const responderTeamIdParamsSchema = z
  .object({
    id: objectIdSchema,
  })
  .strict();

export const listResponderTeamsQuerySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    barangay: z.string().trim().max(200).optional(),
    isActive: booleanQuerySchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export const createResponderTeamSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    code: z.string().trim().max(40).optional(),
    description: z.string().trim().max(500).optional(),
    barangay: z.string().trim().min(1).max(200).optional(),
    municipality: z.string().trim().min(1).max(200).default("Dagupan City").optional(),
    leaderId: objectIdSchema.optional(),
    memberIds: z.array(objectIdSchema).default([]).optional(),
    isActive: z.boolean().default(true).optional(),
  })
  .strict();

export const updateResponderTeamSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    code: z.string().trim().max(40).or(z.literal("")).optional(),
    description: z.string().trim().max(500).or(z.literal("")).optional(),
    barangay: z.string().trim().min(1).max(200).optional(),
    municipality: z.string().trim().min(1).max(200).optional(),
    leaderId: objectIdSchema.nullable().optional(),
    memberIds: z.array(objectIdSchema).optional(),
  })
  .strict();

export type ListResponderTeamsQuery = z.infer<typeof listResponderTeamsQuerySchema>;
export type CreateResponderTeamInput = z.infer<typeof createResponderTeamSchema>;
export type UpdateResponderTeamInput = z.infer<typeof updateResponderTeamSchema>;
