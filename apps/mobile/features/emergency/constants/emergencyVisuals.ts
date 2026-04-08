import {
  AlertCircle,
  Building2,
  Droplets,
  Flame,
  Mountain,
  Siren,
  Stethoscope,
  Wind,
  type LucideIcon,
} from "lucide-react-native";

export type MobileEmergencyVisualType =
  | "sos"
  | "fire"
  | "flood"
  | "typhoon"
  | "earthquake"
  | "collapse"
  | "medical"
  | "other";

export type MobileEmergencyVisual = {
  key: MobileEmergencyVisualType;
  label: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  markerColor: string;
};

const EMERGENCY_VISUALS: Record<MobileEmergencyVisualType, MobileEmergencyVisual> = {
  sos: {
    key: "sos",
    label: "SOS",
    icon: Siren,
    iconBgColor: "#FEE2E2",
    iconColor: "#DC2626",
    markerColor: "#DC2626",
  },
  fire: {
    key: "fire",
    label: "Fire",
    icon: Flame,
    iconBgColor: "#FED7AA",
    iconColor: "#FF5E00",
    markerColor: "#FF5E00",
  },
  flood: {
    key: "flood",
    label: "Flood",
    icon: Droplets,
    iconBgColor: "#DBEAFE",
    iconColor: "#2563EB",
    markerColor: "#2563EB",
  },
  typhoon: {
    key: "typhoon",
    label: "Typhoon",
    icon: Wind,
    iconBgColor: "#E0E7FF",
    iconColor: "#4F46E5",
    markerColor: "#4F46E5",
  },
  earthquake: {
    key: "earthquake",
    label: "Earthquake",
    icon: Mountain,
    iconBgColor: "#FEF3C7",
    iconColor: "#D97706",
    markerColor: "#D97706",
  },
  collapse: {
    key: "collapse",
    label: "Collapse",
    icon: Building2,
    iconBgColor: "#E5E7EB",
    iconColor: "#4B5563",
    markerColor: "#4B5563",
  },
  medical: {
    key: "medical",
    label: "Medical",
    icon: Stethoscope,
    iconBgColor: "#DCFCE7",
    iconColor: "#16A34A",
    markerColor: "#16A34A",
  },
  other: {
    key: "other",
    label: "Other",
    icon: AlertCircle,
    iconBgColor: "#E5E7EB",
    iconColor: "#1F2937",
    markerColor: "#1F2937",
  },
};

export const MOBILE_EMERGENCY_VISUAL_ORDER: MobileEmergencyVisualType[] = [
  "sos",
  "fire",
  "flood",
  "typhoon",
  "earthquake",
  "collapse",
  "medical",
  "other",
];

export function normalizeMobileEmergencyVisualType(raw: unknown): MobileEmergencyVisualType {
  const normalized = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  if (normalized === "sos" || normalized === "sosemergency") return "sos";
  if (normalized === "fire") return "fire";
  if (normalized === "flood") return "flood";
  if (normalized === "typhoon") return "typhoon";
  if (normalized === "earthquake") return "earthquake";
  if (normalized === "collapse") return "collapse";
  if (normalized === "medical") return "medical";
  if (normalized === "other" || normalized === "others") return "other";
  return "other";
}

export function getMobileEmergencyVisual(raw: unknown): MobileEmergencyVisual {
  const type = normalizeMobileEmergencyVisualType(raw);
  return EMERGENCY_VISUALS[type];
}

export function mobileEmergencyLabel(raw: unknown): string {
  return getMobileEmergencyVisual(raw).label;
}

export function mobileEmergencyTitle(raw: unknown): string {
  const type = normalizeMobileEmergencyVisualType(raw);
  if (type === "sos") return "SOS Emergency";
  return `${EMERGENCY_VISUALS[type].label} Emergency`;
}
