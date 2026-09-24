import { useCallback, useState } from "react";
import * as FileSystem from "expo-file-system/legacy";
import { createEmergencyReport, uploadEmergencyReportPhoto } from "../../emergency/services/emergencyApi";
import { useConnectivity } from "../../connectivity/hooks/useConnectivity";
import { isOfflineOrServerUnavailable } from "../../connectivity/utils/networkErrors";
import { useAuth } from "../../auth/AuthProvider";
import { offlineEmergencyRepository } from "../../offline/services/offlineEmergencyRepository";
import { offlineFileService } from "../../offline/services/offlineFileService";
import { openOfflineEmergencySmsComposer } from "../../offline/services/offlineSmsService";
import { formatCoordinateLabel, generateClientRequestId } from "../../offline/utils/offlineEmergency.utils";
import type {
  OfflineEmergencyReportPayload,
  SmsStatus,
} from "../../offline/models/offlineEmergency.types";
import type { ReportDeliveryMode, ReportDraft, ReportSubmitResult } from "../models/report.types";
import {
  PROOF_PHOTO_REQUIRED_ERROR,
  REQUIRED_PROOF_IMAGES,
} from "../constants/report.constants";

export function useSubmitReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReportSubmitResult | null>(null);
  const { isOnline, checkConnectivity } = useConnectivity();
  const { user } = useAuth();

  const submit = useCallback(
    async (draft: ReportDraft): Promise<ReportSubmitResult> => {
      if (!draft.type) {
        const message = "Emergency type is required.";
        setError(message);
        throw new Error(message);
      }

      if (!draft.location?.coords) {
        const message = "Location is required.";
        setError(message);
        throw new Error(message);
      }

      const photos = draft.photos ?? [];
      const validPhoto = photos[0];
      if (!validPhoto?.localUri || photos.length !== REQUIRED_PROOF_IMAGES) {
        const message = PROOF_PHOTO_REQUIRED_ERROR;
        setError(message);
        throw new Error(message);
      }

      setLoading(true);
      setError(null);

      const locationLabel = draft.locationText?.trim() || draft.location?.label?.trim();
      const coords = {
        latitude: draft.location.coords.latitude,
        longitude: draft.location.coords.longitude,
      };

      // 1. Check fresh connectivity
      const freshConnectivity = await checkConnectivity().catch(() => ({ isOnline }));
      const currentlyOnline = freshConnectivity.isOnline;

      if (currentlyOnline) {
        try {
          // Read photo base64
          let base64 = validPhoto.base64;
          if (!base64) {
            base64 = await FileSystem.readAsStringAsync(validPhoto.localUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          }

          // Upload photo
          const uploadRes = await uploadEmergencyReportPhoto({
            base64,
            mimeType: validPhoto.mimeType ?? "image/jpeg",
            fileName: validPhoto.fileName ?? "proof.jpg",
          });

          // Create emergency report with photo URL
          const apiResponse = await createEmergencyReport({
            type: draft.type,
            location: {
              coords,
              label: locationLabel,
            },
            description: draft.description?.trim() ? draft.description.trim() : undefined,
            photos: [uploadRes.url],
          });

          const finalResult: ReportSubmitResult = {
            ...apiResponse,
            deliveryMode: "online",
          };

          setResult(finalResult);
          return finalResult;
        } catch (apiError: any) {
          // If this is a real validation or authentication error, do not convert to offline fallback
          if (!isOfflineOrServerUnavailable(apiError)) {
            const message =
              apiError?.response?.data?.message ??
              apiError?.message ??
              "Failed to submit report.";
            setError(message);
            throw new Error(message);
          }
          // Genuine network or server-unavailable error: fall through to offline flow
        }
      }

      // 2. Offline / Server Unavailable fallback flow
      try {
        const clientRequestId = generateClientRequestId();

        // Save proof to durable storage
        const durableProof = await offlineFileService.persistDurableProof(
          validPhoto.localUri,
          clientRequestId,
          validPhoto.mimeType,
          validPhoto.fileName
        );

        const reporterName = user?.firstName
          ? `${user.firstName} ${user.lastName ?? ""}`.trim()
          : undefined;
        const reporterContact = user?.contactNo ?? undefined;
        const nowIso = new Date().toISOString();

        const offlinePayload: OfflineEmergencyReportPayload = {
          type: draft.type,
          location: {
            coords,
            label: locationLabel,
          },
          description: draft.description?.trim() ? draft.description.trim() : undefined,
          reporterName,
          reporterContact,
          createdAt: nowIso,
        };

        // Enqueue into SQLite FIRST before SMS composer opens
        await offlineEmergencyRepository.enqueue({
          clientRequestId,
          kind: "REPORT",
          payload: offlinePayload,
          proofLocalUri: durableProof.localUri,
          proofMimeType: durableProof.mimeType,
          proofFileName: durableProof.fileName,
          smsStatus: "not_attempted",
        });

        // Open native SMS composer
        const smsStatus: SmsStatus = await openOfflineEmergencySmsComposer({
          kind: "REPORT",
          clientRequestId,
          type: draft.type,
          reporterName,
          reporterContact,
          locationLabel: locationLabel || formatCoordinateLabel(coords.latitude, coords.longitude),
          latitude: coords.latitude,
          longitude: coords.longitude,
          description: draft.description?.trim(),
          timestamp: nowIso,
        });

        // Update SMS status in SQLite
        await offlineEmergencyRepository.markSmsStatus(clientRequestId, smsStatus);

        const deliveryMode: ReportDeliveryMode =
          smsStatus === "sent" || smsStatus === "unknown"
            ? "offline_sms"
            : "offline_queued";

        const offlineResult: ReportSubmitResult = {
          incidentId: clientRequestId,
          referenceNumber: clientRequestId,
          clientRequestId,
          isSos: false,
          verificationStatus: "pending",
          isVisibleOnMap: false,
          createdAt: nowIso,
          location: {
            coords,
            label: locationLabel,
          },
          deliveryMode,
          smsStatus,
        };

        setResult(offlineResult);
        return offlineResult;
      } catch (offlineErr: any) {
        const message =
          offlineErr?.message ?? "Failed to save emergency report offline.";
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [checkConnectivity, isOnline, user]
  );

  return { loading, error, result, submit };
}
