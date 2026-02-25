import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { EmergencyReportModel } from "../features/emergency/models/EmergencyReport.model";
import { generateUniqueReferenceNumber } from "../features/emergency/utils/referenceNumber";

const TEST_REPORT_MARKER = "[TEST] Flood report at pinned coordinates";
const PINNED_LOCATION = {
  latitude: 16.075332780019238,
  longitude: 120.36013440511684,
  label: "Pinned test location (16.075333, 120.360134)",
};

async function seedTestFloodReportPinned() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "";
  if (!mongoUri) throw new Error("Missing MONGODB_URI or MONGO_URI in .env");

  await connectDB(mongoUri);

  try {
    const existing = await EmergencyReportModel.findOne({
      notes: TEST_REPORT_MARKER,
      emergencyType: "FLOOD",
      source: "REPORT_FORM",
    })
      .select("_id referenceNumber")
      .lean();

    const sharedFields = {
      isSos: false,
      emergencyType: "FLOOD" as const,
      source: "REPORT_FORM" as const,
      status: "OPEN" as const,
      verification: {
        status: "approved" as const,
        reviewedAt: new Date(),
        reason: "Seeded test flood emergency at pinned coordinates",
      },
      visibility: {
        isVisibleOnMap: true,
      },
      location: {
        type: "Point" as const,
        coordinates: [PINNED_LOCATION.longitude, PINNED_LOCATION.latitude] as [number, number],
      },
      locationLabel: PINNED_LOCATION.label,
      notes: TEST_REPORT_MARKER,
      photos: [] as string[],
      reporterIsGuest: true,
      reportedAt: new Date(),
    };

    if (existing?._id) {
      await EmergencyReportModel.updateOne({ _id: existing._id }, { $set: sharedFields });
      console.log(
        `Updated test flood report. ID: ${String(existing._id)}, Ref: ${existing.referenceNumber ?? "N/A"}, Coords: [${
          PINNED_LOCATION.latitude
        }, ${PINNED_LOCATION.longitude}]`
      );
      return;
    }

    const referenceNumber = await generateUniqueReferenceNumber();
    const created = await EmergencyReportModel.create({
      ...sharedFields,
      referenceNumber,
    });

    console.log(
      `Created test flood report. ID: ${String(created._id)}, Ref: ${referenceNumber}, Coords: [${PINNED_LOCATION.latitude}, ${
        PINNED_LOCATION.longitude
      }]`
    );
  } finally {
    await mongoose.disconnect();
  }
}

seedTestFloodReportPinned().catch((error) => {
  console.error("Failed to seed test flood report at pinned coordinates:", error);
  process.exit(1);
});
