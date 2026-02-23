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
    iconBgColor: "#1E63E9",
    iconColor: "#FFFFFF",
  },
  {
    key: "flood",
    label: "Flood",
    icon: <Droplets size={ICON_SIZE} />,
    iconBgColor: "#1FA3DD",
    iconColor: "#FFFFFF",
  },
  {
    key: "typhoon",
    label: "Typhoon",
    icon: <Wind size={ICON_SIZE} />,
    iconBgColor: "#F21515",
    iconColor: "#FFFFFF",
  },
  {
    key: "earthquake",
    label: "Earthquake",
    icon: <Mountain size={ICON_SIZE} />,
    iconBgColor: "#E8B407",
    iconColor: "#FFFFFF",
  },
  {
    key: "collapse",
    label: "Collapse",
    icon: <Building2 size={ICON_SIZE} />,
    iconBgColor: "#7C7C7C",
    iconColor: "#FFFFFF",
  },
  {
    key: "medical",
    label: "Medical",
    icon: <Stethoscope size={ICON_SIZE} />,
    iconBgColor: "#D42020",
    iconColor: "#FFFFFF",
  },
  {
    key: "other",
    label: "Other",
    icon: <AlertCircle size={ICON_SIZE} />,
    iconBgColor: "#1E1F22",
    iconColor: "#FFFFFF",
  },
];
