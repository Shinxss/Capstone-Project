import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { EmergencyReportModel } from "../features/emergency/models/EmergencyReport.model";
import { generateUniqueReferenceNumber } from "../features/emergency/utils/referenceNumber";

const TEST_REPORT_MARKER = "[TEST] San Fabian fire report";
const SAN_FABIAN_LOCATION = {
  latitude: 16.1553,
  longitude: 120.4443,
  label: "Poblacion, San Fabian, Pangasinan",
};

async function seedTestFireReportInSanFabian() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "";
  if (!mongoUri) throw new Error("Missing MONGODB_URI or MONGO_URI in .env");

  await connectDB(mongoUri);

  const existing = await EmergencyReportModel.findOne({
    notes: TEST_REPORT_MARKER,
    emergencyType: "FIRE",
    source: "REPORT_FORM",
  })
    .select("_id referenceNumber")
    .lean();

  const sharedFields = {
    isSos: false,
    emergencyType: "FIRE" as const,
    source: "REPORT_FORM" as const,
    status: "OPEN" as const,
    verification: {
      status: "approved" as const,
      reviewedAt: new Date(),
      reason: "Seeded test emergency report",
    },
    visibility: {
      isVisibleOnMap: true,
    },
    location: {
      type: "Point" as const,
      coordinates: [SAN_FABIAN_LOCATION.longitude, SAN_FABIAN_LOCATION.latitude] as [number, number],
    },
    locationLabel: SAN_FABIAN_LOCATION.label,
    notes: TEST_REPORT_MARKER,
    photos: [] as string[],
    reporterIsGuest: true,
    reportedAt: new Date(),
  };

  if (existing?._id) {
    await EmergencyReportModel.updateOne({ _id: existing._id }, { $set: sharedFields });
    console.log(
      `Updated existing test fire report in San Fabian. ID: ${String(existing._id)}, Ref: ${
        existing.referenceNumber ?? "N/A"
      }`
    );
  } else {
    const referenceNumber = await generateUniqueReferenceNumber();
    const created = await EmergencyReportModel.create({
      ...sharedFields,
      referenceNumber,
    });
    console.log(`Created test fire report in San Fabian. ID: ${String(created._id)}, Ref: ${referenceNumber}`);
  }

  await mongoose.disconnect();
}

seedTestFireReportInSanFabian().catch((error) => {
  console.error("Failed to seed test San Fabian fire report:", error);
  process.exit(1);
});
