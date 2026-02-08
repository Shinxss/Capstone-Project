export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "lifeline_theme";
const THEME_EVENT = "lifeline:theme";

type ThemeEventDetail = { mode: ThemeMode };

export function getThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const v = window.localStorage.getItem(THEME_STORAGE_KEY);
  return v === "dark" ? "dark" : "light";
}

export function applyThemeMode(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", mode === "dark");
}

export function setThemeMode(mode: ThemeMode) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }
  applyThemeMode(mode);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<ThemeEventDetail>(THEME_EVENT, { detail: { mode } })
    );
  }
}

export function toggleThemeMode() {
  const next: ThemeMode = getThemeMode() === "dark" ? "light" : "dark";
  setThemeMode(next);
  return next;
}

export function onThemeChange(handler: (mode: ThemeMode) => void) {
  const fn = (e: Event) => {
    const ce = e as CustomEvent<ThemeEventDetail>;
    handler(ce.detail?.mode ?? getThemeMode());
  };

  window.addEventListener(THEME_EVENT, fn);
  return () => window.removeEventListener(THEME_EVENT, fn);
}

/** Call once at app start to apply localStorage theme to <html>. */
export function initTheme() {
  applyThemeMode(getThemeMode());
}
