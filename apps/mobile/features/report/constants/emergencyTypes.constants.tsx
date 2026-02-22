import React from "react";
import {
  AlertCircle,
  Building2,
  Droplets,
  Flame,
  Mountain,
  Stethoscope,
  Wind,
} from "lucide-react-native";
import type { EmergencyTypeOption } from "../models/report.types";

const ICON_SIZE = 24;

export const EMERGENCY_TYPE_OPTIONS: EmergencyTypeOption[] = [
  {
    key: "fire",
    label: "Fire",
    icon: <Flame size={ICON_SIZE} />,
    iconBgClass: "bg-red-100",
    iconColorClass: "text-red-600",
  },
  {
    key: "flood",
    label: "Flood",
    icon: <Droplets size={ICON_SIZE} />,
    iconBgClass: "bg-blue-100",
    iconColorClass: "text-blue-600",
  },
  {
    key: "typhoon",
    label: "Typhoon",
    icon: <Wind size={ICON_SIZE} />,
    iconBgClass: "bg-sky-100",
    iconColorClass: "text-sky-600",
  },
  {
    key: "earthquake",
    label: "Earthquake",
    icon: <Mountain size={ICON_SIZE} />,
    iconBgClass: "bg-amber-100",
    iconColorClass: "text-amber-700",
  },
  {
    key: "collapse",
    label: "Collapse",
    icon: <Building2 size={ICON_SIZE} />,
    iconBgClass: "bg-zinc-200",
    iconColorClass: "text-zinc-700",
  },
  {
    key: "medical",
    label: "Medical",
    icon: <Stethoscope size={ICON_SIZE} />,
    iconBgClass: "bg-emerald-100",
    iconColorClass: "text-emerald-700",
  },
  {
    key: "other",
    label: "Other",
    icon: <AlertCircle size={ICON_SIZE} />,
    iconBgClass: "bg-violet-100",
    iconColorClass: "text-violet-700",
  },
];
