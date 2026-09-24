import { getOfflineDatabase } from "../database/offlineDatabase";
import type {
  EnqueueEmergencyInput,
  PendingEmergencyReportRow,
  SmsStatus,
  SyncStatus,
} from "../models/offlineEmergency.types";

export class OfflineEmergencyRepository {
  async enqueue(input: EnqueueEmergencyInput): Promise<PendingEmergencyReportRow> {
    const db = await getOfflineDatabase();
    const now = new Date().toISOString();
    const payloadJson = JSON.stringify(input.payload);
    const smsStatus: SmsStatus = input.smsStatus ?? "not_attempted";
    const syncStatus: SyncStatus = "pending";

    await db.runAsync(
      `INSERT INTO pending_emergency_reports (
        client_request_id,
        kind,
        payload_json,
        proof_local_uri,
        proof_mime_type,
        proof_file_name,
        sms_status,
        sync_status,
        retry_count,
        last_error,
        server_incident_id,
        server_reference_number,
        created_at,
        updated_at,
        synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, NULL, ?, ?, NULL);`,
      input.clientRequestId,
      input.kind,
      payloadJson,
      input.proofLocalUri ?? null,
      input.proofMimeType ?? null,
      input.proofFileName ?? null,
      smsStatus,
      syncStatus,
      now,
      now
    );

    return {
      client_request_id: input.clientRequestId,
      kind: input.kind,
      payload_json: payloadJson,
      proof_local_uri: input.proofLocalUri ?? null,
      proof_mime_type: input.proofMimeType ?? null,
      proof_file_name: input.proofFileName ?? null,
      sms_status: smsStatus,
      sync_status: syncStatus,
      retry_count: 0,
      last_error: null,
      server_incident_id: null,
      server_reference_number: null,
      created_at: now,
      updated_at: now,
      synced_at: null,
    };
  }

  async getById(clientRequestId: string): Promise<PendingEmergencyReportRow | null> {
    const db = await getOfflineDatabase();
    const row = await db.getFirstAsync<PendingEmergencyReportRow>(
      `SELECT * FROM pending_emergency_reports WHERE client_request_id = ?;`,
      clientRequestId
    );
    return row ?? null;
  }

  async getPending(): Promise<PendingEmergencyReportRow[]> {
    const db = await getOfflineDatabase();
    const rows = await db.getAllAsync<PendingEmergencyReportRow>(
      `SELECT * FROM pending_emergency_reports 
       WHERE sync_status IN ('pending', 'failed')
       ORDER BY created_at ASC;`
    );
    return rows;
  }

  async markSmsStatus(clientRequestId: string, smsStatus: SmsStatus): Promise<void> {
    const db = await getOfflineDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE pending_emergency_reports 
       SET sms_status = ?, updated_at = ? 
       WHERE client_request_id = ?;`,
      smsStatus,
      now,
      clientRequestId
    );
  }

  async markSyncing(clientRequestId: string): Promise<void> {
    const db = await getOfflineDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE pending_emergency_reports 
       SET sync_status = 'syncing', updated_at = ? 
       WHERE client_request_id = ?;`,
      now,
      clientRequestId
    );
  }

  async markFailed(clientRequestId: string, errorMessage: string): Promise<void> {
    const db = await getOfflineDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE pending_emergency_reports 
       SET sync_status = 'failed', 
           retry_count = retry_count + 1, 
           last_error = ?, 
           updated_at = ? 
       WHERE client_request_id = ?;`,
      errorMessage.slice(0, 500),
      now,
      clientRequestId
    );
  }

  async markSynced(
    clientRequestId: string,
    serverIncidentId: string,
    serverReferenceNumber: string
  ): Promise<void> {
    const db = await getOfflineDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE pending_emergency_reports 
       SET sync_status = 'synced', 
           server_incident_id = ?, 
           server_reference_number = ?, 
           synced_at = ?, 
           last_error = NULL,
           updated_at = ? 
       WHERE client_request_id = ?;`,
      serverIncidentId,
      serverReferenceNumber,
      now,
      now,
      clientRequestId
    );
  }

  async incrementRetry(clientRequestId: string, errorMessage?: string): Promise<void> {
    const db = await getOfflineDatabase();
    const now = new Date().toISOString();
    if (errorMessage) {
      await db.runAsync(
        `UPDATE pending_emergency_reports 
         SET retry_count = retry_count + 1, last_error = ?, updated_at = ? 
         WHERE client_request_id = ?;`,
        errorMessage.slice(0, 500),
        now,
        clientRequestId
      );
    } else {
      await db.runAsync(
        `UPDATE pending_emergency_reports 
         SET retry_count = retry_count + 1, updated_at = ? 
         WHERE client_request_id = ?;`,
        now,
        clientRequestId
      );
    }
  }
}

export const offlineEmergencyRepository = new OfflineEmergencyRepository();
