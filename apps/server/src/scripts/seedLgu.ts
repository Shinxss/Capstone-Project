import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db";
import { User } from "../features/users/user.model";

type SeedLguAccountInput = {
  username: string;
  firstName: string;
  lastName: string;
  lguPosition?: string;
  lguName?: string;
  barangay: string;
  municipality?: string;
  email?: string;
  isActive?: boolean;
};

function parseSeedAccounts(raw: string | undefined): SeedLguAccountInput[] | null {
  if (!raw || !raw.trim()) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    const items: SeedLguAccountInput[] = [];
    for (const entry of parsed) {
      const row = entry as Partial<SeedLguAccountInput>;
      if (!row?.username || !row?.barangay) continue;

      items.push({
        username: String(row.username).trim(),
        firstName: String(row.firstName ?? "").trim(),
        lastName: String(row.lastName ?? "").trim(),
        lguPosition: row.lguPosition ? String(row.lguPosition).trim() : undefined,
        lguName: row.lguName ? String(row.lguName).trim() : undefined,
        barangay: String(row.barangay).trim(),
        municipality: row.municipality ? String(row.municipality).trim() : undefined,
        email: row.email ? String(row.email).trim().toLowerCase() : undefined,
        isActive: row.isActive ?? true,
      });
    }

    return items;
  } catch {
    return null;
  }
}

async function seedLGU() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "";
  if (!mongoUri) throw new Error("Missing MONGODB_URI or MONGO_URI in .env");

  await connectDB(mongoUri);

  const defaultPassword = process.env.SEED_LGU_DEFAULT_PASSWORD || "Lifeline@123";
  const defaultMunicipality = (process.env.SEED_LGU_MUNICIPALITY || "Dagupan City").trim();
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const fromEnv = parseSeedAccounts(process.env.SEED_LGU_ACCOUNTS_JSON);

  const lguAccounts: SeedLguAccountInput[] =
    fromEnv && fromEnv.length > 0
      ? fromEnv
      : [
          {
            username: "lgu_poblacion_oeste",
            firstName: "Juan",
            lastName: "Dela Cruz",
            lguPosition: "CDRRMO Focal",
            lguName: "Barangay Poblacion Oeste",
            barangay: "Poblacion Oeste",
            municipality: defaultMunicipality,
            isActive: true,
          },
          {
            username: "lgu_bonuan_gueset",
            firstName: "Maria",
            lastName: "Santos",
            lguPosition: "Barangay Secretary",
            lguName: "Barangay Bonuan Gueset",
            barangay: "Bonuan Gueset",
            municipality: defaultMunicipality,
            isActive: true,
          },
        ];

  let created = 0;
  let updated = 0;

  for (const account of lguAccounts) {
    const res = await User.updateOne(
      { username: account.username },
      {
        $set: {
          username: account.username,
          email: account.email,
          role: "LGU",
          firstName: account.firstName,
          lastName: account.lastName,
          lguPosition: account.lguPosition ?? "",
          lguName: account.lguName ?? account.barangay,
          barangay: account.barangay,
          municipality: account.municipality ?? defaultMunicipality,
          isActive: account.isActive ?? true,
          volunteerStatus: "NONE",
          passwordHash,
        },
      },
      { upsert: true }
    );

    if (res.upsertedCount && res.upsertedCount > 0) created += 1;
    else if (res.matchedCount && res.matchedCount > 0) updated += 1;
  }

  console.log(`LGU seed done. Created: ${created}, Updated: ${updated}`);
  console.log(`Default password for seeded LGU accounts: ${defaultPassword}`);
  process.exit(0);
}

seedLGU().catch((error) => {
  console.error(error);
  process.exit(1);
});
