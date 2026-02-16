import { useCallback, useEffect, useState } from "react";
import type { LguSettings, NotificationPrefs, UiPrefs } from "../models/settings.types";
import { defaultSettings, loadSettings, saveSettings } from "../services/settings.service";

export type SettingsPatch = {
  notifications?: Partial<NotificationPrefs>;
  ui?: Partial<UiPrefs>;
};

export function useLguSettings() {
  const [settings, setSettings] = useState<LguSettings>(defaultSettings());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      setError(null);
      const cur = loadSettings();
      setSettings(cur);
      setSavedAt(cur.updatedAt);
    } catch (e: any) {
      setError(e?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const update = useCallback((patch: SettingsPatch) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, ...(patch.notifications || {}) },
      ui: { ...prev.ui, ...(patch.ui || {}) },
    }));
  }, []);

  const save = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      const saved = saveSettings({ notifications: settings.notifications, ui: settings.ui });
      setSettings(saved);
      setSavedAt(saved.updatedAt);
    } catch (e: any) {
      setError(e?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }, [settings.notifications, settings.ui]);

  const reset = useCallback(() => {
    const d = defaultSettings();
    setSettings(d);
    setSavedAt(d.updatedAt);
  }, []);

  return { settings, update, refresh, save, reset, loading, saving, error, savedAt };
}
