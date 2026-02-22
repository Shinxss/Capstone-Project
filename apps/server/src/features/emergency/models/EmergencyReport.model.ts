import { type HydratedDocument } from "mongoose";
import { EmergencyReport, type IEmergencyReport as LegacyEmergencyReport } from "../emergency.model";

export const EMERGENCY_REPORT_TYPES = [
  "fire",
  "flood",
  "typhoon",
  "earthquake",
  "collapse",
  "medical",
  "other",
] as const;

export const EMERGENCY_REPORT_STATUSES = [
  "open",
  "assigned",
  "in_progress",
  "resolved",
  "cancelled",
] as const;

export const EMERGENCY_REPORT_VERIFICATION_STATUSES = [
  "not_required",
  "pending",
  "approved",
  "rejected",
] as const;

export type EmergencyReportType = (typeof EMERGENCY_REPORT_TYPES)[number];
export type EmergencyReportStatus = (typeof EMERGENCY_REPORT_STATUSES)[number];
export type EmergencyReportVerificationStatus =
  (typeof EMERGENCY_REPORT_VERIFICATION_STATUSES)[number];

export type IEmergencyReport = LegacyEmergencyReport;
export type EmergencyReportDocument = HydratedDocument<IEmergencyReport>;

export const EmergencyReportModel = EmergencyReport;
