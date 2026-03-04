import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  APP_THEME_PALETTES,
  type AppThemeMode,
  type AppThemePalette,
} from "./themePalette";

const THEME_STORAGE_KEY = "lifeline_mobile_theme_mode";

type AppThemeContextValue = {
  mode: AppThemeMode;
  isDark: boolean;
  hydrated: boolean;
  palette: AppThemePalette;
  setMode: (nextMode: AppThemeMode) => void;
  toggleMode: () => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppThemeMode>("light");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;

    void (async () => {
      try {
        const storedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (!alive) return;

        if (storedMode === "light" || storedMode === "dark") {
          setModeState(storedMode);
        }
      } finally {
        if (alive) setHydrated(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const setMode = useCallback((nextMode: AppThemeMode) => {
    setModeState(nextMode);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode).catch(() => {
      // ignore storage failures
    });
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prevMode) => {
      const nextMode: AppThemeMode = prevMode === "dark" ? "light" : "dark";
      void AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode).catch(() => {
        // ignore storage failures
      });
      return nextMode;
    });
  }, []);

  const value = useMemo<AppThemeContextValue>(
    () => ({
      mode,
      isDark: mode === "dark",
      hydrated,
      palette: APP_THEME_PALETTES[mode],
      setMode,
      toggleMode,
    }),
    [hydrated, mode, setMode, toggleMode]
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }

  return context;
}
