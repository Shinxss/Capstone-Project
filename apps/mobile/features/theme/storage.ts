import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ThemeMode } from "./types";

const STORAGE_KEY = "lifeline.theme.mode";
const LEGACY_STORAGE_KEY = "lifeline_mobile_theme_mode";

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

export async function getThemeMode(): Promise<ThemeMode> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (isThemeMode(stored)) {
      if (stored === "system") {
        await AsyncStorage.setItem(STORAGE_KEY, "light");
        return "light";
      }
      return stored;
    }

    const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    if (isThemeMode(legacy)) {
      const normalized = legacy === "system" ? "light" : legacy;
      await AsyncStorage.setItem(STORAGE_KEY, normalized);
      return normalized;
    }
  } catch {
    // ignore and fall back to light
  }

  return "light";
}

export async function setThemeMode(mode: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore storage failures
  }
}
