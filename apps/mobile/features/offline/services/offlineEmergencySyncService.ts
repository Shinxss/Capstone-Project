import { createEmergencyReport, createSosReport, uploadEmergencyReportPhoto } from "../../emergency/services/emergencyApi";
import { isOfflineOrServerUnavailable } from "../../connectivity/utils/networkErrors";
import { offlineEmergencyRepository } from "./offlineEmergencyRepository";
import { offlineFileService } from "./offlineFileService";
import type {
  OfflineEmergencyReportPayload,
  OfflineSosPayload,
  PendingEmergencyReportRow,
} from "../models/offlineEmergency.types";

let syncInFlight = false;
const syncListeners = new Set<(syncedCount: number) => void>();

export function subscribeSyncComplete(callback: (syncedCount: number) => void): () => void {
  syncListeners.add(callback);
  return () => {
    syncListeners.delete(callback);
  };
}

function notifySyncComplete(syncedCount: number) {
  syncListeners.forEach((callback) => {
    try {
      callback(syncedCount);
    } catch {
      // Ignore listener error
    }
  });
}

export class OfflineEmergencySyncService {
  isSyncing(): boolean {
    return syncInFlight;
  }

  async syncPendingEmergencies(): Promise<{ syncedCount: number; failedCount: number }> {
    if (syncInFlight) {
      return { syncedCount: 0, failedCount: 0 };
    }

    syncInFlight = true;
    let syncedCount = 0;
    let failedCount = 0;

    try {
      const pendingRows = await offlineEmergencyRepository.getPending();
      if (pendingRows.length === 0) {
        return { syncedCount: 0, failedCount: 0 };
      }

      for (const row of pendingRows) {
        try {
          const success = await this.syncSingleRow(row);
          if (success) {
            syncedCount += 1;
          } else {
            failedCount += 1;
          }
        } catch (error: any) {
          failedCount += 1;
          const isConnectivityIssue = isOfflineOrServerUnavailable(error);
          const errorMsg = String(error?.message ?? "Sync failed");
          await offlineEmergencyRepository.markFailed(row.client_request_id, errorMsg);

          // If device lost connection, stop looping through remainder
          if (isConnectivityIssue) {
            break;
          }
        }
      }

      if (syncedCount > 0) {
        notifySyncComplete(syncedCount);
      }

      return { syncedCount, failedCount };
    } finally {
      syncInFlight = false;
    }
  }

  private async syncSingleRow(row: PendingEmergencyReportRow): Promise<boolean> {
    await offlineEmergencyRepository.markSyncing(row.client_request_id);

    let parsedPayload: any;
    try {
      parsedPayload = JSON.parse(row.payload_json);
    } catch {
      await offlineEmergencyRepository.markFailed(
        row.client_request_id,
        "Malformed payload JSON"
      );
      return false;
    }

    if (row.kind === "SOS") {
      const sosPayload = parsedPayload as OfflineSosPayload;
      const response = await createSosReport({
        lat: sosPayload.lat,
        lng: sosPayload.lng,
        accuracy: sosPayload.accuracy,
        ...(sosPayload.locationLabel ? { locationLabel: sosPayload.locationLabel } : {}),
        ...(sosPayload.notes ? { notes: sosPayload.notes } : {}),
        ...(sosPayload.guestReporter ? { guestReporter: sosPayload.guestReporter } : {}),
      });

      await offlineEmergencyRepository.markSynced(
        row.client_request_id,
        response.incidentId,
        response.referenceNumber
      );
      return true;
    }

    if (row.kind === "REPORT") {
      const reportPayload = parsedPayload as OfflineEmergencyReportPayload;

      if (!row.proof_local_uri) {
        await offlineEmergencyRepository.markFailed(
          row.client_request_id,
          "Missing proof photo for emergency report"
        );
        return false;
      }

      // 1. Read durable local photo
      let base64Photo: string;
      try {
        base64Photo = await offlineFileService.readDurableProofAsBase64(row.proof_local_uri);
      } catch (readErr: any) {
        await offlineEmergencyRepository.markFailed(
          row.client_request_id,
          `Unable to read proof file: ${readErr?.message ?? "Not found"}`
        );
        return false;
      }

      // 2. Upload proof photo using existing API
      const uploadResponse = await uploadEmergencyReportPhoto({
        base64: base64Photo,
        mimeType: row.proof_mime_type ?? "image/jpeg",
        fileName: row.proof_file_name ?? `proof_${row.client_request_id}.jpg`,
      });

      // 3. Create report with uploaded photo URL
      const reportResponse = await createEmergencyReport({
        type: reportPayload.type,
        location: reportPayload.location,
        description: reportPayload.description,
        photos: [uploadResponse.url],
      });

      // 4. Mark synced in database
      await offlineEmergencyRepository.markSynced(
        row.client_request_id,
        reportResponse.incidentId,
        reportResponse.referenceNumber
      );

      // 5. Clean up local proof file only after successful upload & sync
      await offlineFileService.deleteDurableProof(
        row.proof_local_uri,
        row.client_request_id
      );

      return true;
    }

    return false;
  }
}

export const offlineEmergencySyncService = new OfflineEmergencySyncService();
