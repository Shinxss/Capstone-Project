import { useEffect, useMemo, useState } from "react";
import {
  getThemeMode,
  initTheme,
  onThemeChange,
  setThemeMode,
  toggleThemeMode,
  type ThemeMode,
} from "../services/themeService";

export function useThemeMode() {
  const [mode, setMode] = useState<ThemeMode>(() => getThemeMode());

  useEffect(() => {
    // ensure <html> has correct class when hook mounts
    initTheme();
    setMode(getThemeMode());

    // sync with same-tab changes
    const off = onThemeChange((m) => setMode(m));

    // sync with other tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key !== "lifeline_theme") return;
      setMode(getThemeMode());
      initTheme();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      off();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const api = useMemo(
    () => ({
      mode,
      isDark: mode === "dark",
      setMode: (m: ThemeMode) => setThemeMode(m),
      toggle: () => toggleThemeMode(),
    }),
    [mode]
  );

  return api;
}
