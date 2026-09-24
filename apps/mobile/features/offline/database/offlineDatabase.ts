import * as SQLite from "expo-sqlite";
import { migrateDbIfNeeded } from "./migrations";

export const OFFLINE_DATABASE_NAME = "lifeline_offline.db";

let dbInstancePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getOfflineDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstancePromise) {
    dbInstancePromise = (async () => {
      const db = await SQLite.openDatabaseAsync(OFFLINE_DATABASE_NAME);
      await migrateDbIfNeeded(db);
      return db;
    })();
  }
  return dbInstancePromise;
}

export async function initOfflineDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await migrateDbIfNeeded(db);
}
