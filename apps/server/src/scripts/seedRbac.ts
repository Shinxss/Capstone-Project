import "dotenv/config";
import { connectDB } from "../config/db";
import { seedDefaultRoleProfiles } from "../features/rbac/rbac.service";

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "";
  if (!MONGODB_URI) throw new Error("Missing MONGODB_URI or MONGO_URI in .env");

  await connectDB(MONGODB_URI);

  const overwritePermissions =
    String(process.env.SEED_RBAC_OVERWRITE ?? "true").trim().toLowerCase() !== "false";

  await seedDefaultRoleProfiles({ overwritePermissions });
  console.log(`RBAC role profiles seeded (overwritePermissions=${overwritePermissions}).`);
  process.exit(0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
