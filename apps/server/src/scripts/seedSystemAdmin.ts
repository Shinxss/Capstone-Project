import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db";
import { User } from "../features/users/user.model";

async function seedSystemAdmin() {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "";
  if (!MONGODB_URI) throw new Error("Missing MONGODB_URI or MONGO_URI in .env");
  await connectDB(MONGODB_URI);

  const username = (process.env.SYSTEM_ADMIN_USERNAME || "sysadmin").trim();
  const email = (process.env.SYSTEM_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.SYSTEM_ADMIN_PASSWORD || "";

  if (!email) throw new Error("Missing SYSTEM_ADMIN_EMAIL in .env");
  if (!password) throw new Error("Missing SYSTEM_ADMIN_PASSWORD in .env");

  const passwordHash = await bcrypt.hash(password, 10);

  const res = await User.updateOne(
    { username },
    {
      $set: {
        username,
        email,
        role: "ADMIN",
        adminTier: "SUPER",
        firstName: "System",
        lastName: "Admin",
        passwordHash,
        emailVerified: true,
        isActive: true,
        volunteerStatus: "NONE",
      },
    },
    { upsert: true }
  );

  const created = res.upsertedCount ? res.upsertedCount : 0;
  const updated = res.matchedCount ? res.matchedCount : 0;

  console.log(`System Admin seed done. Created: ${created}, Updated: ${updated}`);
  console.log(`Username: ${username}`);
  console.log(`Email (for MFA): ${email}`);
  process.exit(0);
}

seedSystemAdmin().catch((error) => {
  console.error(error);
  process.exit(1);
});
