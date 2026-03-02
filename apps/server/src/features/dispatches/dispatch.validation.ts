import { z } from "zod";

export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

export const createDispatchOffersSchema = z
  .object({
    emergencyId: objectId,
    volunteerIds: z.array(objectId).min(1, "volunteerIds is required"),
  })
  .strict();

export const dispatchIdParamsSchema = z
  .object({ id: objectId })
  .strict();

export const respondSchema = z
  .object({ decision: z.enum(["ACCEPT", "DECLINE"]).transform((v) => v.toUpperCase()) })
  .strict();

export const proofSchema = z
  .object({
    base64: z.string().trim().min(1, "base64 is required").max(4_500_000, "Proof payload is too large"),
    mimeType: z.enum(["image/png", "image/jpeg", "image/heic"]).optional(),
    fileName: z.string().trim().min(1).max(255).optional(),
  })
  .strict();

export const listTasksQuerySchema = z
  .object({
    status: z.string().optional(),
  })
  .strict();

export const verifySchema = z.object({}).strict();

export const revokeSchema = z
  .object({
    reason: z.string().trim().min(1, "reason is required").max(500, "reason must be at most 500 chars"),
  })
  .strict();

export const reverifySchema = z
  .object({
    completedAt: z.string().datetime().nullable().optional(),
    proofUrls: z.array(z.string().trim().min(1).max(500)).max(100).optional(),
    proofFileHashes: z
      .array(z.string().trim().regex(/^0x[a-fA-F0-9]{64}$/, "proofFileHashes must contain 0x-prefixed sha256 hashes"))
      .max(100)
      .optional(),
  })
  .strict();

export const dispatchLocationUpdateSchema = z
  .object({
    lng: z.number().finite().min(-180).max(180),
    lat: z.number().finite().min(-90).max(90),
    accuracy: z.number().finite().min(0).optional(),
    heading: z.number().finite().min(0).max(360).optional(),
    speed: z.number().finite().min(0).optional(),
  })
  .strict();
