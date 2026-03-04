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
      return stored;
    }

    const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    if (isThemeMode(legacy)) {
      await AsyncStorage.setItem(STORAGE_KEY, legacy);
      return legacy;
    }
  } catch {
    // ignore and fall back to system
  }

  return "system";
}

export async function setThemeMode(mode: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore storage failures
  }
}
