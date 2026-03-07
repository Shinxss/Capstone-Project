import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchPushPreferences,
  updatePushPreferences,
} from "../../notifications/services/pushRegistrationApi";

type UseProfileNotificationPreferencesOptions = {
  enabled: boolean;
  role?: string;
  volunteerStatus?: string;
};

export function useProfileNotificationPreferences(options: UseProfileNotificationPreferencesOptions) {
  const { enabled, role, volunteerStatus } = options;
  const [communityUpdatesEnabled, setCommunityUpdatesEnabled] = useState(true);
  const [volunteerAssignmentsEnabled, setVolunteerAssignmentsEnabled] = useState(true);
  const [updating, setUpdating] = useState(false);

  const canShowVolunteerAssignmentsToggle = useMemo(() => {
    const normalizedRole = String(role ?? "").trim().toUpperCase();
    const normalizedVolunteerStatus = String(volunteerStatus ?? "").trim().toUpperCase();
    return enabled && (normalizedRole === "VOLUNTEER" || normalizedVolunteerStatus === "APPROVED");
  }, [enabled, role, volunteerStatus]);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setCommunityUpdatesEnabled(true);
      setVolunteerAssignmentsEnabled(true);
      return;
    }

    try {
      const prefs = await fetchPushPreferences();
      setCommunityUpdatesEnabled(Boolean(prefs.notificationPrefs?.communityRequestUpdates ?? true));
      setVolunteerAssignmentsEnabled(Boolean(prefs.notificationPrefs?.volunteerAssignments ?? true));
    } catch {
      // Keep previous values when preferences cannot be loaded.
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onToggleCommunityUpdates = useCallback(
    async (nextValue: boolean) => {
      if (!enabled || updating) return;
      setCommunityUpdatesEnabled(nextValue);
      setUpdating(true);
      try {
        const updated = await updatePushPreferences({ communityRequestUpdates: nextValue });
        setCommunityUpdatesEnabled(Boolean(updated.notificationPrefs?.communityRequestUpdates ?? nextValue));
      } catch {
        setCommunityUpdatesEnabled((prev) => !prev);
      } finally {
        setUpdating(false);
      }
    },
    [enabled, updating]
  );

  const onToggleVolunteerAssignments = useCallback(
    async (nextValue: boolean) => {
      if (!enabled || updating) return;
      setVolunteerAssignmentsEnabled(nextValue);
      setUpdating(true);
      try {
        const updated = await updatePushPreferences({ volunteerAssignments: nextValue });
        setVolunteerAssignmentsEnabled(Boolean(updated.notificationPrefs?.volunteerAssignments ?? nextValue));
      } catch {
        setVolunteerAssignmentsEnabled((prev) => !prev);
      } finally {
        setUpdating(false);
      }
    },
    [enabled, updating]
  );

  return {
    communityUpdatesEnabled,
    volunteerAssignmentsEnabled,
    updating,
    canShowVolunteerAssignmentsToggle,
    refresh,
    onToggleCommunityUpdates,
    onToggleVolunteerAssignments,
  };
}
