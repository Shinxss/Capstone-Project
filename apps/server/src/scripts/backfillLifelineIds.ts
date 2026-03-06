import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { User } from "../features/users/user.model";
import { generateNextLifelineId, normalizeLifelineId } from "../features/users/userId.service";

const MISSING_LIFELINE_FILTER = {
  $or: [{ lifelineId: { $exists: false } }, { lifelineId: null }, { lifelineId: "" }],
};

function resolveCreatedAtDate(value: unknown): Date | undefined {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  return undefined;
}

async function assignLifelineIdIfMissing(userId: unknown, createdAt?: Date) {
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const lifelineId = await generateNextLifelineId(createdAt);
    try {
      const result = await User.updateOne(
        { _id: userId, ...MISSING_LIFELINE_FILTER },
        { $set: { lifelineId } }
      );

      if (result.modifiedCount > 0) return "assigned" as const;
      return "skipped" as const;
    } catch (error: any) {
      if (error?.code === 11000) {
        continue;
      }
      throw error;
    }
  }

  throw new Error(`Exceeded retry limit while assigning lifelineId for user ${String(userId)}.`);
}

async function run() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "";
  if (!mongoUri) throw new Error("Missing MONGODB_URI or MONGO_URI in .env");

  await connectDB(mongoUri);

  const totalMissing = await User.countDocuments(MISSING_LIFELINE_FILTER);
  console.log(`[backfill:lifeline-ids] Users missing lifelineId: ${totalMissing}`);

  if (totalMissing === 0) {
    await mongoose.disconnect();
    console.log("[backfill:lifeline-ids] Nothing to backfill.");
    process.exit(0);
  }

  let processed = 0;
  let assigned = 0;
  let skipped = 0;
  let failed = 0;

  const cursor = User.find(MISSING_LIFELINE_FILTER)
    .sort({ createdAt: 1, _id: 1 })
    .select("_id createdAt lifelineId")
    .lean()
    .cursor();

  for await (const user of cursor) {
    processed += 1;

    if (normalizeLifelineId(user?.lifelineId)) {
      skipped += 1;
      continue;
    }

    const createdAt = resolveCreatedAtDate(user?.createdAt);

    try {
      const result = await assignLifelineIdIfMissing(user?._id, createdAt);
      if (result === "assigned") assigned += 1;
      else skipped += 1;
    } catch (error) {
      failed += 1;
      console.error(`[backfill:lifeline-ids] Failed for user ${String(user?._id)}:`, error);
    }

    if (processed % 100 === 0 || processed === totalMissing) {
      console.log(
        `[backfill:lifeline-ids] Progress ${processed}/${totalMissing} | assigned=${assigned} skipped=${skipped} failed=${failed}`
      );
    }
  }

  console.log("[backfill:lifeline-ids] Done.");
  console.log(
    `[backfill:lifeline-ids] Summary: processed=${processed}, assigned=${assigned}, skipped=${skipped}, failed=${failed}`
  );

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (error) => {
  console.error("[backfill:lifeline-ids] Fatal error:", error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
