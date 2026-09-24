import { useCallback, useEffect, useRef } from "react";
import { useConnectivity } from "../../connectivity/hooks/useConnectivity";
import { offlineEmergencySyncService } from "../services/offlineEmergencySyncService";

export function useOfflineEmergencySync() {
  const { isOnline, status } = useConnectivity();
  const previousOnlineRef = useRef<boolean | null>(null);

  const syncNow = useCallback(async () => {
    return offlineEmergencySyncService.syncPendingEmergencies();
  }, []);

  useEffect(() => {
    // When status is known and device is online
    if (status !== "unknown") {
      const wasOffline = previousOnlineRef.current === false;
      const initialOnline = previousOnlineRef.current === null && isOnline;

      if (isOnline && (wasOffline || initialOnline)) {
        void offlineEmergencySyncService.syncPendingEmergencies();
      }

      previousOnlineRef.current = isOnline;
    }
  }, [isOnline, status]);

  return {
    syncNow,
    isSyncing: offlineEmergencySyncService.isSyncing(),
  };
}
