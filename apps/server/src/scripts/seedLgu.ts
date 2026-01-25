import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db";
import { User } from "../models/Users";

async function seedLGU() {
  const MONGODB_URI = process.env.MONGODB_URI || "";
  if (!MONGODB_URI) throw new Error("Missing MONGODB_URI in .env");

  await connectDB(MONGODB_URI);

  const defaultPassword = process.env.SEED_LGU_DEFAULT_PASSWORD || "Lifeline@123";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // ✅ Edit these as your real LGU accounts
  const lguAccounts = [
    {
      username: "lgu_admin_1",
      role: "LGU" as const,
      lguName: "Barangay Sample 1",
      barangay: "Sample Barangay",
      municipality: "Sample City",
      isActive: true,
      passwordHash,
    },
    {
      username: "lgu_admin_2",
      role: "LGU" as const,
      lguName: "Barangay Sample 2",
      barangay: "Sample Barangay 2",
      municipality: "Sample City",
      isActive: true,
      passwordHash,
    },
  ];

  let created = 0;

  for (const acc of lguAccounts) {
    const exists = await User.findOne({ username: acc.username });
    if (exists) continue;
    await User.create(acc);
    created++;
  }

  console.log(`✅ LGU seed done. Created: ${created}`);
  console.log(`🔐 Default password for seeded accounts: ${defaultPassword}`);
  process.exit(0);
}

seedLGU().catch((e) => {
  console.error(e);
  process.exit(1);
});
