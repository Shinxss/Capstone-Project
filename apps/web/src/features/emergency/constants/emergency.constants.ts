import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Droplet,
  Flame,
  Zap,
  Siren,
  HeartPulse,
  HelpCircle,
} from "lucide-react";

export type EmergencyType = "SOS" | "FIRE" | "FLOOD" | "EARTHQUAKE" | "MEDICAL" | "OTHER";

export const EMERGENCY_TYPE_LABEL: Record<EmergencyType, string> = {
  SOS: "SOS",
  FIRE: "Fire",
  FLOOD: "Flood",
  EARTHQUAKE: "Earthquake",
  MEDICAL: "Medical",
  OTHER: "Other",
};

export const EMERGENCY_TYPE_COLOR: Record<EmergencyType, string> = {
  SOS: "#EF4444", // bright red
  FIRE: "#DC2626", // red
  FLOOD: "#2563EB", // blue
  EARTHQUAKE: "#F59E0B", // amber
  MEDICAL: "#10B981", // green
  OTHER: "#64748B", // slate
};

export const EMERGENCY_TYPE_ICON: Record<EmergencyType, LucideIcon> = {
  SOS: Siren,
  FIRE: Flame,
  FLOOD: Droplet,
  EARTHQUAKE: Zap,
  MEDICAL: HeartPulse,
  OTHER: HelpCircle,
};

export function normalizeEmergencyType(raw: string): EmergencyType {
  const t = String(raw || "").toUpperCase();
  if (t === "SOS") return "SOS";
  if (t === "FIRE") return "FIRE";
  if (t === "FLOOD") return "FLOOD";
  if (t === "EARTHQUAKE") return "EARTHQUAKE";
  if (t === "MEDICAL") return "MEDICAL";
  return "OTHER";
}

export function iconForEmergency(type: EmergencyType): LucideIcon {
  return EMERGENCY_TYPE_ICON[type] ?? AlertTriangle;
}

export function colorForEmergency(type: EmergencyType): string {
  return EMERGENCY_TYPE_COLOR[type] ?? "#64748B";
}
