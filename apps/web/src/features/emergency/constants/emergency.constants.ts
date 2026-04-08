import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  AlertCircle,
  Building2,
  Droplets,
  Flame,
  Mountain,
  Siren,
  Stethoscope,
  Wind,
} from "lucide-react";

export type EmergencyType =
  | "SOS"
  | "FIRE"
  | "FLOOD"
  | "TYPHOON"
  | "EARTHQUAKE"
  | "COLLAPSE"
  | "MEDICAL"
  | "OTHER";

export const EMERGENCY_TYPE_LABEL: Record<EmergencyType, string> = {
  SOS: "SOS",
  FIRE: "Fire",
  FLOOD: "Flood",
  TYPHOON: "Typhoon",
  EARTHQUAKE: "Earthquake",
  COLLAPSE: "Collapse",
  MEDICAL: "Medical",
  OTHER: "Other",
};

export const EMERGENCY_TYPE_COLOR: Record<EmergencyType, string> = {
  SOS: "#DC2626",
  FIRE: "#FF5E00",
  FLOOD: "#2563EB",
  TYPHOON: "#4F46E5",
  EARTHQUAKE: "#D97706",
  COLLAPSE: "#4B5563",
  MEDICAL: "#16A34A",
  OTHER: "#1F2937",
};

export const EMERGENCY_TYPE_ICON: Record<EmergencyType, LucideIcon> = {
  SOS: Siren,
  FIRE: Flame,
  FLOOD: Droplets,
  TYPHOON: Wind,
  EARTHQUAKE: Mountain,
  COLLAPSE: Building2,
  MEDICAL: Stethoscope,
  OTHER: AlertCircle,
};

export function normalizeEmergencyType(raw: string): EmergencyType {
  const t = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, "");
  if (t === "SOS" || t === "SOSEMERGENCY") return "SOS";
  if (t === "FIRE") return "FIRE";
  if (t === "FLOOD") return "FLOOD";
  if (t === "TYPHOON") return "TYPHOON";
  if (t === "EARTHQUAKE") return "EARTHQUAKE";
  if (t === "COLLAPSE") return "COLLAPSE";
  if (t === "MEDICAL") return "MEDICAL";
  if (t === "OTHER" || t === "OTHERS") return "OTHER";
  return "OTHER";
}

export function emergencyTitleForType(type: EmergencyType): string {
  if (type === "SOS") return "SOS Emergency";
  return `${EMERGENCY_TYPE_LABEL[type]} Emergency`;
}

export function iconForEmergency(type: EmergencyType): LucideIcon {
  return EMERGENCY_TYPE_ICON[type] ?? AlertTriangle;
}

export function colorForEmergency(type: EmergencyType): string {
  return EMERGENCY_TYPE_COLOR[type] ?? "#64748B";
}
