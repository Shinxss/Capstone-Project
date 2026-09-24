import { useCallback, useState } from "react";
import { getDeviceLocation } from "../services/locationService";
import { createSosReport } from "../services/emergencyApi";
import { reverseGeocodeCoords } from "../../../shared/services/locationService";
import { useConnectivity } from "../../connectivity/hooks/useConnectivity";
import { isOfflineOrServerUnavailable } from "../../connectivity/utils/networkErrors";
import { useAuth } from "../../auth/AuthProvider";
import { offlineEmergencyRepository } from "../../offline/services/offlineEmergencyRepository";
import { openOfflineEmergencySmsComposer } from "../../offline/services/offlineSmsService";
import { formatCoordinateLabel, generateClientRequestId } from "../../offline/utils/offlineEmergency.utils";
import type { GuestEmergencyContactInput } from "../models/guestEmergencyContact.types";
import type {
  DeliveryMode,
  OfflineSosPayload,
  SmsStatus,
} from "../../offline/models/offlineEmergency.types";

const REVERSE_GEOCODE_TIMEOUT_MS = 4_000;

async function getOptionalLocationLabel(latitude: number, longitude: number) {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      reverseGeocodeCoords({ latitude, longitude }).catch(() => null),
      new Promise<null>((resolve) => {
        timeoutHandle = setTimeout(() => resolve(null), REVERSE_GEOCODE_TIMEOUT_MS);
      }),
    ]);
  } catch {
    return null;
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

export type SosExecutionResult = {
  incidentId: string;
  referenceNumber: string;
  clientRequestId?: string;
  deliveryMode: DeliveryMode;
  isSos: boolean;
  lat: number;
  lng: number;
  smsStatus?: SmsStatus;
};

export function useSosReport() {
  const [sending, setSending] = useState(false);
  const { isOnline, checkConnectivity } = useConnectivity();
  const { user } = useAuth();

  const sendSos = useCallback(
    async (guestReporter?: GuestEmergencyContactInput): Promise<SosExecutionResult> => {
      setSending(true);
      try {
        // 1. Capture GPS
        const loc = await getDeviceLocation();
        // 2. Resolve label if possible, never block on it
        const locationLabel = await getOptionalLocationLabel(loc.lat, loc.lng);

        // 3. Check connectivity
        const freshConnectivity = await checkConnectivity().catch(() => ({ isOnline }));
        const currentlyOnline = freshConnectivity.isOnline;

        if (currentlyOnline) {
          try {
            const report = await createSosReport({
              lat: loc.lat,
              lng: loc.lng,
              accuracy: loc.accuracy,
              ...(locationLabel ? { locationLabel } : {}),
              ...(guestReporter ? { guestReporter } : {}),
            });

            return {
              incidentId: report.incidentId,
              referenceNumber: report.referenceNumber,
              deliveryMode: "online",
              isSos: true,
              lat: loc.lat,
              lng: loc.lng,
            };
          } catch (error: any) {
            // If failure is not genuine offline / server-unavailable, re-throw real validation/auth error
            if (!isOfflineOrServerUnavailable(error)) {
              throw error;
            }
            // Fall through to offline queue + SMS flow
          }
        }

        // 4. Offline / Server-unavailable fallback
        const clientRequestId = generateClientRequestId();
        const nowIso = new Date().toISOString();

        const reporterName =
          guestReporter?.fullName ??
          (user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : undefined);
        const reporterContact = guestReporter?.phoneNumber ?? user?.contactNo ?? undefined;

        const offlinePayload: OfflineSosPayload = {
          lat: loc.lat,
          lng: loc.lng,
          accuracy: loc.accuracy,
          locationLabel: locationLabel || undefined,
          guestReporter,
          reporterName,
          reporterContact,
          createdAt: nowIso,
        };

        // Enqueue SOS in SQLite FIRST before SMS composer opens
        await offlineEmergencyRepository.enqueue({
          clientRequestId,
          kind: "SOS",
          payload: offlinePayload,
          smsStatus: "not_attempted",
        });

        // Open native SMS composer
        const smsStatus: SmsStatus = await openOfflineEmergencySmsComposer({
          kind: "SOS",
          clientRequestId,
          type: "SOS",
          reporterName,
          reporterContact,
          locationLabel: locationLabel || formatCoordinateLabel(loc.lat, loc.lng),
          latitude: loc.lat,
          longitude: loc.lng,
          timestamp: nowIso,
        });

        // Store SMS status
        await offlineEmergencyRepository.markSmsStatus(clientRequestId, smsStatus);

        const deliveryMode: DeliveryMode =
          smsStatus === "sent" || smsStatus === "unknown"
            ? "offline_sms"
            : "offline_queued";

        return {
          incidentId: clientRequestId,
          referenceNumber: clientRequestId,
          clientRequestId,
          deliveryMode,
          isSos: true,
          lat: loc.lat,
          lng: loc.lng,
          smsStatus,
        };
      } finally {
        setSending(false);
      }
    },
    [checkConnectivity, isOnline, user]
  );

  return { sending, sendSos };
}
