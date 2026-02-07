import { Types } from "mongoose";
import { EmergencyReport } from "../../models/EmergencyReport";

type CreateSosInput = {
  reportedBy: Types.ObjectId;
  lat: number;
  lng: number;
  accuracy?: number;
  notes?: string;
};

export async function createSosReport(input: CreateSosInput) {
  const doc = await EmergencyReport.create({
    emergencyType: "SOS",
    source: "SOS_BUTTON",
    status: "OPEN",
    location: {
      type: "Point",
      coordinates: [input.lng, input.lat],
      accuracy: input.accuracy,
    },
    notes: input.notes,
    reportedBy: input.reportedBy,
    reportedAt: new Date(),
  });

  return doc;
}

// ✅ LIST REPORTS (latest first)
export async function listReports({ limit = 200 }: { limit?: number }) {
  const docs = await EmergencyReport.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("reportedBy", "firstName lastName role username email lguName municipality barangay");

  return docs;
}
