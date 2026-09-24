import type { SQLiteDatabase } from "expo-sqlite";

export const TARGET_DATABASE_VERSION = 1;

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  await db.execAsync("PRAGMA journal_mode = WAL;");

  const result = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version;");
  const currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion >= TARGET_DATABASE_VERSION) {
    return;
  }

  if (currentDbVersion === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS pending_emergency_reports (
        client_request_id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        proof_local_uri TEXT NULL,
        proof_mime_type TEXT NULL,
        proof_file_name TEXT NULL,
        sms_status TEXT NOT NULL,
        sync_status TEXT NOT NULL,
        retry_count INTEGER NOT NULL DEFAULT 0,
        last_error TEXT NULL,
        server_incident_id TEXT NULL,
        server_reference_number TEXT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced_at TEXT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_pending_reports_sync_created
      ON pending_emergency_reports (sync_status, created_at);

      PRAGMA user_version = 1;
    `);
  }
}
