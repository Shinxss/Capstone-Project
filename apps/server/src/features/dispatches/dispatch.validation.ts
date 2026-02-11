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
    base64: z.string().min(1),
    mimeType: z.string().min(1).optional(),
    fileName: z.string().min(1).optional(),
  })
  .strict();

export const listTasksQuerySchema = z
  .object({
    status: z.string().optional(),
  })
  .strict();
