import { z } from "zod";
import {
  EMERGENCY_REPORT_TYPES,
  EMERGENCY_REPORT_VERIFICATION_STATUSES,
} from "../models/EmergencyReport.model";

export const createEmergencyReportSchema = z
  .object({
    isSos: z.boolean(),
    type: z.enum(EMERGENCY_REPORT_TYPES),
    location: z.object({
      coords: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      }),
      label: z.string().trim().min(1).max(160).optional(),
    }),
    description: z.string().trim().max(1000).optional(),
    photos: z.array(z.string().trim().min(1).max(500)).min(3).max(5).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (!data.isSos && (!Array.isArray(data.photos) || data.photos.length < 3)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["photos"],
        message: "At least 3 proof images are required.",
      });
    }
  });

export const uploadEmergencyReportPhotoSchema = z
  .object({
    base64: z.string().trim().min(1).max(4_500_000),
    mimeType: z.enum(["image/png", "image/jpeg", "image/heic"]).optional(),
    fileName: z.string().trim().min(1).max(255).optional(),
  })
  .strict();

export const emergencyReportIdParamSchema = z
  .object({
    id: z.string().trim().min(1),
  })
  .strict();

export const approvalsStatusQuerySchema = z
  .object({
    status: z.enum(EMERGENCY_REPORT_VERIFICATION_STATUSES).optional().default("pending"),
  })
  .strict();

export const rejectEmergencyReportSchema = z
  .object({
    reason: z.string().trim().min(3).max(300),
  })
  .strict();

export const referenceNumberParamSchema = z
  .object({
    referenceNumber: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^EM-\d{4}-[A-Z0-9]{6}$/),
  })
  .strict();

export const MY_REQUEST_STATUS_TABS = [
  "all",
  "submitted",
  "verification",
  "assigned",
  "en_route",
  "arrived",
  "review",
  "resolved",
  "cancelled",
] as const;

export const myEmergencyReportsQuerySchema = z
  .object({
    tab: z.enum(MY_REQUEST_STATUS_TABS).optional(),
    scope: z.enum(["active", "history"]).optional(),
  })
  .strict();

export type CreateEmergencyReportInput = z.infer<typeof createEmergencyReportSchema>;
export type UploadEmergencyReportPhotoInput = z.infer<typeof uploadEmergencyReportPhotoSchema>;
export type RejectEmergencyReportInput = z.infer<typeof rejectEmergencyReportSchema>;
export type MyEmergencyReportsQuery = z.infer<typeof myEmergencyReportsQuerySchema>;
export type MyRequestStatusTab = (typeof MY_REQUEST_STATUS_TABS)[number];
