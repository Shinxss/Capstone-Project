import { Types } from "mongoose";
import { EmergencyReport } from "./emergency.model";
import { findBarangayByPoint } from "../barangays/barangay.service"; // ✅ add

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

// ✅ LIST REPORTS (latest first) + include barangay
export async function listReports({ limit = 200 }: { limit?: number }) {
  const docs = await EmergencyReport.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("reportedBy", "firstName lastName role username email lguName municipality barangay")
    .lean();

  // small in-request cache (prevents repeat lookups for same coords)
  const cache = new Map<string, any>();

  const enriched = await Promise.all(
    docs.map(async (d: any) => {
      const coords = d.location?.coordinates;
      const lng = Array.isArray(coords) ? coords[0] : NaN;
      const lat = Array.isArray(coords) ? coords[1] : NaN;

      let barangay = null;

      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        const key = `${lng.toFixed(5)},${lat.toFixed(5)}`;
        if (cache.has(key)) {
          barangay = cache.get(key);
        } else {
          barangay = await findBarangayByPoint(lng, lat, {
            city: "Dagupan City",
            province: "Pangasinan",
          });
          cache.set(key, barangay ?? null);
        }
      }

      return {
        ...d,
        barangayName: barangay?.name ?? null,
        barangayCity: barangay?.city ?? null,
        barangayProvince: barangay?.province ?? null,
      };
    })
  );

  return enriched;
}
