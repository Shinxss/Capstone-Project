import { z } from "zod";

export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");

const booleanQuerySchema = z.enum(["true", "false"]);

export const responderAccountIdParamsSchema = z
  .object({
    id: objectIdSchema,
  })
  .strict();

export const listResponderAccountsQuerySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    barangay: z.string().trim().max(200).optional(),
    isActive: booleanQuerySchema.optional(),
    onDuty: booleanQuerySchema.optional(),
    teamId: objectIdSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export const createResponderAccountSchema = z
  .object({
    username: z.string().trim().min(3).max(64),
    password: z.string().min(8).max(200),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.string().trim().email().toLowerCase().optional(),
    contactNo: z.string().trim().max(20).optional(),
    barangay: z.string().trim().min(1).max(200).optional(),
    municipality: z.string().trim().min(1).max(200).default("Dagupan City").optional(),
    skills: z.string().trim().max(300).optional(),
    onDuty: z.boolean().default(true).optional(),
    isActive: z.boolean().default(true).optional(),
  })
  .strict();

export const updateResponderAccountSchema = z
  .object({
    username: z.string().trim().min(3).max(64).optional(),
    password: z.string().min(8).max(200).optional(),
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    email: z.string().trim().email().toLowerCase().or(z.literal("")).optional(),
    contactNo: z.string().trim().max(20).or(z.literal("")).optional(),
    barangay: z.string().trim().min(1).max(200).optional(),
    municipality: z.string().trim().min(1).max(200).optional(),
    skills: z.string().trim().max(300).or(z.literal("")).optional(),
    onDuty: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const listDispatchableRespondersQuerySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    barangay: z.string().trim().max(200).optional(),
    teamId: objectIdSchema.optional(),
    limit: z.coerce.number().int().min(1).max(200).default(100),
  })
  .strict();

export type ListResponderAccountsQuery = z.infer<typeof listResponderAccountsQuerySchema>;
export type CreateResponderAccountInput = z.infer<typeof createResponderAccountSchema>;
export type UpdateResponderAccountInput = z.infer<typeof updateResponderAccountSchema>;
export type ListDispatchableRespondersQuery = z.infer<typeof listDispatchableRespondersQuerySchema>;
