import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db";
import { User } from "../models/User";

async function seedLGU() {
  const MONGODB_URI = process.env.MONGODB_URI || "";
  if (!MONGODB_URI) throw new Error("Missing MONGODB_URI in .env");

  await connectDB(MONGODB_URI);

  const defaultPassword =
    process.env.SEED_LGU_DEFAULT_PASSWORD || "Lifeline@123";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // ✅ Edit these as your real LGU accounts
  const lguAccounts = [
    {
      username: "lgu_admin_1",
      role: "LGU" as const,

      // ✅ NEW
      firstName: "Juan",
      lastName: "Dela Cruz",
      lguPosition: "MDRRMO Officer",

      lguName: "Barangay Sample 1",
      barangay: "Sample Barangay",
      municipality: "Sample City",

      isActive: true,
      passwordHash,
      volunteerStatus: "NONE" as const,
    },
    {
      username: "lgu_admin_2",
      role: "LGU" as const,

      // ✅ NEW
      firstName: "Maria",
      lastName: "Santos",
      lguPosition: "Barangay Secretary",

      lguName: "Barangay Sample 2",
      barangay: "Sample Barangay 2",
      municipality: "Sample City",

      isActive: true,
      passwordHash,
      volunteerStatus: "NONE" as const,
    },
  ];

  let created = 0;
  let updated = 0;

  for (const acc of lguAccounts) {
    // ✅ Upsert by username (re-runnable seed)
    const res = await User.updateOne(
      { username: acc.username },
      {
        $set: {
          role: acc.role,

          firstName: acc.firstName,
          lastName: acc.lastName,
          lguPosition: acc.lguPosition,

          lguName: acc.lguName,
          barangay: acc.barangay,
          municipality: acc.municipality,

          isActive: acc.isActive,
          volunteerStatus: acc.volunteerStatus,

          // ✅ Keep seed deterministic:
          // update password every time you run seed
          passwordHash: acc.passwordHash,
        },
      },
      { upsert: true }
    );

    if (res.upsertedCount && res.upsertedCount > 0) created++;
    else if (res.matchedCount && res.matchedCount > 0) updated++;
  }

  console.log(`✅ LGU seed done. Created: ${created}, Updated: ${updated}`);
  console.log(`🔐 Default password for seeded accounts: ${defaultPassword}`);
  process.exit(0);
}

seedLGU().catch((e) => {
  console.error(e);
  process.exit(1);
});
