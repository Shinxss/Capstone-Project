import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db";
import { User } from "../features/users/user.model";

async function seedSystemAdmin() {
  const MONGODB_URI = process.env.MONGODB_URI || "";
  if (!MONGODB_URI) throw new Error("Missing MONGODB_URI in .env");
  await connectDB(MONGODB_URI);

  const username = (process.env.SYSTEM_ADMIN_USERNAME || "sysadmin").trim();
  const email = (process.env.SYSTEM_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.SYSTEM_ADMIN_PASSWORD || "";

  if (!email) throw new Error("Missing SYSTEM_ADMIN_EMAIL in .env");
  if (!password) throw new Error("Missing SYSTEM_ADMIN_PASSWORD in .env");

  const passwordHash = await bcrypt.hash(password, 10);

  // ✅ Upsert by username; also enforces email is present for MFA
  const res = await User.updateOne(
    { username },
    {
      $set: {
        username,
        email, // ✅ used for MFA/OTP
        role: "ADMIN",
        firstName: "System",
        lastName: "Admin",
        passwordHash, // ⚠️ resets password every seed run
        isActive: true,
        volunteerStatus: "NONE",
      },
    },
    { upsert: true }
  );

  const created = res.upsertedCount ? res.upsertedCount : 0;
  const updated = res.matchedCount ? res.matchedCount : 0;

  console.log(`✅ System Admin seed done. Created: ${created}, Updated: ${updated}`);
  console.log(`👤 Username: ${username}`);
  console.log(`📧 Email (for MFA): ${email}`);
  process.exit(0);
}

seedSystemAdmin().catch((e) => {
  console.error(e);
  process.exit(1);
});
