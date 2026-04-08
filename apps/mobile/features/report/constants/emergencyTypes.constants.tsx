import React from "react";
import type { EmergencyTypeOption } from "../models/report.types";
import { getMobileEmergencyVisual } from "../../emergency/constants/emergencyVisuals";

const ICON_SIZE = 24;

const REPORT_TYPE_ORDER: EmergencyTypeOption["key"][] = [
  "fire",
  "flood",
  "typhoon",
  "earthquake",
  "collapse",
  "medical",
  "other",
];

const REPORT_ICON_BG_COLORS: Record<EmergencyTypeOption["key"], string> = {
  fire: "#F97316",
  flood: "#0EA5E9",
  typhoon: "#7C3AED",
  earthquake: "#D97706",
  collapse: "#4B5563",
  medical: "#16A34A",
  other: "#111827",
};

export const EMERGENCY_TYPE_OPTIONS: EmergencyTypeOption[] = REPORT_TYPE_ORDER.map((key) => {
  const visual = getMobileEmergencyVisual(key);
  const Icon = visual.icon;
  return {
    key,
    label: visual.label,
    icon: <Icon size={ICON_SIZE} />,
    iconBgColor: REPORT_ICON_BG_COLORS[key],
    iconColor: "#FFFFFF",
  };
});
