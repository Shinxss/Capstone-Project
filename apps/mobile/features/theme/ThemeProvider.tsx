import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Appearance, View, useColorScheme } from "react-native";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import { getThemeMode, setThemeMode as persistThemeMode } from "./storage";
import type { ThemeMode } from "./types";

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (nextMode: ThemeMode) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveIsDark(mode: ThemeMode, scheme: "light" | "dark" | null | undefined): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return scheme === "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();
  const [mode, setModeState] = useState<ThemeMode | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const stored = await getThemeMode();
      if (!alive) return;
      setModeState(stored);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const effectiveMode: ThemeMode = mode ?? "system";
  const isDark = resolveIsDark(effectiveMode, systemScheme);

  useEffect(() => {
    if (effectiveMode === "system") {
      Appearance.setColorScheme(null);
      setColorScheme(null);
      return;
    }

    Appearance.setColorScheme(effectiveMode);
    setColorScheme(effectiveMode);
  }, [effectiveMode, setColorScheme]);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    void persistThemeMode(nextMode);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode: effectiveMode,
      isDark,
      setMode,
    }),
    [effectiveMode, isDark, setMode]
  );

  if (!mode) {
    return <View className="flex-1 bg-lgu-lightBg dark:bg-lgu-darkBg" />;
  }

  return (
    <ThemeContext.Provider value={value}>
      <View className="flex-1 bg-lgu-lightBg dark:bg-lgu-darkBg">{children}</View>
    </ThemeContext.Provider>
  );
}
