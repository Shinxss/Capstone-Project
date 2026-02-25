import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { EmergencyReportModel } from "../features/emergency/models/EmergencyReport.model";
import { generateUniqueReferenceNumber } from "../features/emergency/utils/referenceNumber";

const TEST_REPORT_MARKER = "[TEST] Bolosan building collapse report";
const BOLOSAN_LOCATION = {
  latitude: 16.04717781000005,
  longitude: 120.36552415750009,
  label: "Bolosan, Dagupan City, Pangasinan",
};

async function seedTestCollapseReportBolosan() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "";
  if (!mongoUri) throw new Error("Missing MONGODB_URI or MONGO_URI in .env");

  await connectDB(mongoUri);

  try {
    const existing = await EmergencyReportModel.findOne({
      notes: TEST_REPORT_MARKER,
      emergencyType: "COLLAPSE",
      source: "REPORT_FORM",
    })
      .select("_id referenceNumber")
      .lean();

    const sharedFields = {
      isSos: false,
      emergencyType: "COLLAPSE" as const,
      source: "REPORT_FORM" as const,
      status: "OPEN" as const,
      verification: {
        status: "approved" as const,
        reviewedAt: new Date(),
        reason: "Seeded test building collapse emergency report",
      },
      visibility: {
        isVisibleOnMap: true,
      },
      location: {
        type: "Point" as const,
        coordinates: [BOLOSAN_LOCATION.longitude, BOLOSAN_LOCATION.latitude] as [number, number],
      },
      locationLabel: BOLOSAN_LOCATION.label,
      notes: TEST_REPORT_MARKER,
      photos: [] as string[],
      reporterIsGuest: true,
      reportedAt: new Date(),
    };

    if (existing?._id) {
      await EmergencyReportModel.updateOne({ _id: existing._id }, { $set: sharedFields });
      console.log(
        `Updated test collapse report in Bolosan. ID: ${String(existing._id)}, Ref: ${
          existing.referenceNumber ?? "N/A"
        }, Coords: [${BOLOSAN_LOCATION.latitude}, ${BOLOSAN_LOCATION.longitude}]`
      );
      return;
    }

    const referenceNumber = await generateUniqueReferenceNumber();
    const created = await EmergencyReportModel.create({
      ...sharedFields,
      referenceNumber,
    });

    console.log(
      `Created test collapse report in Bolosan. ID: ${String(created._id)}, Ref: ${referenceNumber}, Coords: [${
        BOLOSAN_LOCATION.latitude
      }, ${BOLOSAN_LOCATION.longitude}]`
    );
  } finally {
    await mongoose.disconnect();
  }
}

seedTestCollapseReportBolosan().catch((error) => {
  console.error("Failed to seed test Bolosan building collapse report:", error);
  process.exit(1);
});
