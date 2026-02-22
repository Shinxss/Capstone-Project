import { Types } from "mongoose";
import { NotificationState } from "./notificationState.model";

function normalizeNotificationIds(ids: string[]) {
  return Array.from(
    new Set(
      (Array.isArray(ids) ? ids : [])
        .map((id) => String(id || "").trim())
        .filter(Boolean)
    )
  ).slice(0, 500);
}

function asObjectId(userId: string) {
  return Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null;
}

export type NotificationStateMap = Record<
  string,
  {
    read: boolean;
    archived: boolean;
  }
>;

export async function queryNotificationStates(userId: string, ids: string[]): Promise<NotificationStateMap> {
  const objectId = asObjectId(userId);
  if (!objectId) return {};

  const notificationIds = normalizeNotificationIds(ids);
  if (notificationIds.length === 0) return {};

  const rows = await NotificationState.find({
    userId: objectId,
    notificationId: { $in: notificationIds },
  })
    .select("notificationId read archived")
    .lean();

  const result: NotificationStateMap = {};
  for (const row of rows) {
    const id = String(row.notificationId || "");
    if (!id) continue;
    result[id] = {
      read: Boolean(row.read),
      archived: Boolean(row.archived),
    };
  }

  return result;
}

export async function setNotificationReadState(userId: string, ids: string[], read: boolean) {
  const objectId = asObjectId(userId);
  if (!objectId) return { updated: 0 };

  const notificationIds = normalizeNotificationIds(ids);
  if (notificationIds.length === 0) return { updated: 0 };

  const now = new Date();
  await NotificationState.bulkWrite(
    notificationIds.map((notificationId) => ({
      updateOne: {
        filter: { userId: objectId, notificationId },
        update: {
          $set: {
            read,
            updatedAt: now,
          },
          $setOnInsert: {
            userId: objectId,
            notificationId,
            archived: false,
            createdAt: now,
          },
        },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  return { updated: notificationIds.length };
}

export async function setNotificationArchivedState(userId: string, ids: string[], archived: boolean) {
  const objectId = asObjectId(userId);
  if (!objectId) return { updated: 0 };

  const notificationIds = normalizeNotificationIds(ids);
  if (notificationIds.length === 0) return { updated: 0 };

  const now = new Date();
  await NotificationState.bulkWrite(
    notificationIds.map((notificationId) => ({
      updateOne: {
        filter: { userId: objectId, notificationId },
        update: {
          $set: {
            archived,
            updatedAt: now,
          },
          $setOnInsert: {
            userId: objectId,
            notificationId,
            read: false,
            createdAt: now,
          },
        },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  return { updated: notificationIds.length };
}

