export type AppThemeMode = "light" | "dark";

export type AppThemePalette = {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceActive: string;
  border: string;
  divider: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  icon: string;
  iconMuted: string;
  danger: string;
  dangerSoft: string;
  shortcutIconBg: string;
  gradientColors: [string, string, string];
};

export const APP_THEME_PALETTES: Record<AppThemeMode, AppThemePalette> = {
  light: {
    background: "#F9F9F9",
    surface: "#FFFFFF",
    surfaceMuted: "#F2F2F2",
    surfaceActive: "#F8FAFC",
    border: "#E4E4E7",
    divider: "#ECECEC",
    textPrimary: "#181818",
    textSecondary: "#686868",
    textMuted: "#656565",
    icon: "#737373",
    iconMuted: "#7A7A7A",
    danger: "#DC2626",
    dangerSoft: "#FEE2E2",
    shortcutIconBg: "#FEE2E2",
    gradientColors: ["#F8DCDD", "#FDF2F2", "rgba(255,255,255,0)"],
  },
  dark: {
    background: "#060C18",
    surface: "#0B1220",
    surfaceMuted: "#0E1626",
    surfaceActive: "#0F1A2E",
    border: "#162544",
    divider: "#162544",
    textPrimary: "#E2E8F0",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
    icon: "#CBD5E1",
    iconMuted: "#94A3B8",
    danger: "#DC2626",
    dangerSoft: "#3B1C28",
    shortcutIconBg: "#2E1E28",
    gradientColors: ["rgba(15,26,46,0.90)", "rgba(11,18,32,0.55)", "rgba(6,12,24,0)"],
  },
};
