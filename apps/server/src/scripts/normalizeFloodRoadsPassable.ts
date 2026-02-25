import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db";

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI in .env");
  }

  // Choose collection:
  // 1) CLI: --collection roads_flood
  // 2) .env: FLOOD_ROADS_COLLECTION=roads_flood
  // 3) default: roads_flood_5yr
  const collection =
    getArg("--collection") ||
    process.env.FLOOD_ROADS_COLLECTION ||
    "roads_flood_5yr";

  await connectDB(mongoUri);

  const col = mongoose.connection.collection(collection);

  // A) Fill top-level csv_passable when missing/null using rawProperties.csv_passable
  // Normalize into number 0/1.
  const fillFilter = {
    $and: [
      {
        $or: [{ csv_passable: { $exists: false } }, { csv_passable: null }],
      },
      { "rawProperties.csv_passable": { $exists: true, $ne: null } },
    ],
  };

  const fillUpdatePipeline: any[] = [
    {
      $set: {
        csv_passable: {
          $let: {
            vars: {
              v: "$rawProperties.csv_passable",
              t: { $type: "$rawProperties.csv_passable" },
            },
            in: {
              $switch: {
                branches: [
                  // bool -> 1/0
                  {
                    case: { $eq: ["$$t", "bool"] },
                    then: { $cond: ["$$v", 1, 0] },
                  },
                  // numeric -> >0 => 1 else 0
                  {
                    case: {
                      $in: ["$$t", ["int", "long", "double", "decimal"]],
                    },
                    then: { $cond: [{ $gt: ["$$v", 0] }, 1, 0] },
                  },
                  // string -> "true"/"1" => 1, "false"/"0" => 0
                  {
                    case: { $eq: ["$$t", "string"] },
                    then: {
                      $let: {
                        vars: { s: { $toLower: "$$v" } },
                        in: {
                          $switch: {
                            branches: [
                              {
                                case: {
                                  $in: ["$$s", ["true", "1", "yes", "y"]],
                                },
                                then: 1,
                              },
                              {
                                case: {
                                  $in: ["$$s", ["false", "0", "no", "n"]],
                                },
                                then: 0,
                              },
                            ],
                            default: null,
                          },
                        },
                      },
                    },
                  },
                ],
                default: null,
              },
            },
          },
        },
      },
    },
  ];

  const fillRes = await col.updateMany(fillFilter, fillUpdatePipeline);
  console.log(
    `✅ [${collection}] filled csv_passable from rawProperties.csv_passable: matched=${fillRes.matchedCount}, modified=${fillRes.modifiedCount}`
  );

  // B) Normalize any top-level boolean csv_passable to number (if exists)
  const normalizeBoolFilter = { csv_passable: { $type: "bool" } as any };
  const normalizeBoolUpdatePipeline: any[] = [
    {
      $set: {
        csv_passable: { $cond: ["$csv_passable", 1, 0] },
      },
    },
  ];

  const boolRes = await col.updateMany(
    normalizeBoolFilter,
    normalizeBoolUpdatePipeline
  );
  console.log(
    `✅ [${collection}] normalized boolean csv_passable to 0/1: matched=${boolRes.matchedCount}, modified=${boolRes.modifiedCount}`
  );

  // Optional quick stats
  const remainingNull = await col.countDocuments({
    $or: [{ csv_passable: null }, { csv_passable: { $exists: false } }],
  });
  console.log(`ℹ️ [${collection}] remaining csv_passable null/missing: ${remainingNull}`);

  await mongoose.disconnect();
  console.log("✅ Done.");
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});