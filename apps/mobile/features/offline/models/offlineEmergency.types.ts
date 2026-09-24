import type { GuestEmergencyContactInput } from "../../emergency/models/guestEmergencyContact.types";
import type { EmergencyType, ReportLocation } from "../../report/models/report.types";

export type OfflineEmergencyKind = "SOS" | "REPORT";

export type SmsStatus =
  | "not_attempted"
  | "composer_opened"
  | "sent"
  | "cancelled"
  | "unknown"
  | "unavailable";

export type SyncStatus = "pending" | "syncing" | "failed" | "synced";

export type OfflineSosPayload = {
  lat: number;
  lng: number;
  accuracy?: number;
  locationLabel?: string;
  notes?: string;
  guestReporter?: GuestEmergencyContactInput;
  reporterName?: string;
  reporterContact?: string;
  createdAt: string;
};

export type OfflineEmergencyReportPayload = {
  type: EmergencyType;
  location: ReportLocation;
  description?: string;
  reporterName?: string;
  reporterContact?: string;
  createdAt: string;
};

export type OfflineEmergencyPayload =
  | { kind: "SOS"; payload: OfflineSosPayload }
  | { kind: "REPORT"; payload: OfflineEmergencyReportPayload };

export type PendingEmergencyReportRow = {
  client_request_id: string;
  kind: OfflineEmergencyKind;
  payload_json: string;
  proof_local_uri: string | null;
  proof_mime_type: string | null;
  proof_file_name: string | null;
  sms_status: SmsStatus;
  sync_status: SyncStatus;
  retry_count: number;
  last_error: string | null;
  server_incident_id: string | null;
  server_reference_number: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
};

export type EnqueueEmergencyInput = {
  clientRequestId: string;
  kind: OfflineEmergencyKind;
  payload: OfflineSosPayload | OfflineEmergencyReportPayload;
  proofLocalUri?: string | null;
  proofMimeType?: string | null;
  proofFileName?: string | null;
  smsStatus?: SmsStatus;
};

export type DeliveryMode = "online" | "offline_sms" | "offline_queued";

export type OfflineSubmitResult = {
  mode: DeliveryMode;
  clientRequestId?: string;
  incidentId?: string;
  referenceNumber?: string;
  isSos: boolean;
  lat?: number;
  lng?: number;
  smsStatus?: SmsStatus;
};
