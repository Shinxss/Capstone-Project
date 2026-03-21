import { Types } from "mongoose";
import { DispatchOffer } from "../dispatches/dispatch.model";
import { EmergencyReport } from "./emergency.model";
import { findBarangayByPoint } from "../barangays/barangay.service"; // ✅ add

type DashboardWorkflowProgressLabel =
  | "Submitted"
  | "Assigned"
  | "En Route"
  | "Arrived"
  | "Resolved"
  | "Cancelled";

const DASHBOARD_PROGRESS_PERCENT_BY_LABEL: Record<DashboardWorkflowProgressLabel, number> = {
  Submitted: 20,
  Assigned: 40,
  "En Route": 60,
  Arrived: 80,
  Resolved: 100,
  Cancelled: 0,
};

function toStatus(raw: unknown) {
  return String(raw ?? "").trim().toUpperCase();
}

function deriveDashboardWorkflowProgress(
  emergencyStatusRaw: unknown,
  offerStatuses: Set<string>
): { progressLabel: DashboardWorkflowProgressLabel; progressPercent: number } {
  const emergencyStatus = toStatus(emergencyStatusRaw);
  let progressLabel: DashboardWorkflowProgressLabel = "Submitted";

  if (emergencyStatus === "CANCELLED") {
    progressLabel = "Cancelled";
  } else if (emergencyStatus === "RESOLVED" || offerStatuses.has("VERIFIED")) {
    progressLabel = "Resolved";
  } else if (offerStatuses.has("DONE")) {
    progressLabel = "Arrived";
  } else if (offerStatuses.has("ACCEPTED")) {
    progressLabel = "En Route";
  } else if (offerStatuses.size > 0) {
    progressLabel = "Assigned";
  }

  return {
    progressLabel,
    progressPercent: DASHBOARD_PROGRESS_PERCENT_BY_LABEL[progressLabel],
  };
}

type CreateSosInput = {
  reportedBy: Types.ObjectId;
  lat: number;
  lng: number;
  accuracy?: number;
  notes?: string;
  locationLabel?: string;
};

export async function createSosReport(input: CreateSosInput) {
  let locationLabel = String(input.locationLabel ?? "").trim() || undefined;

  // Backfill a readable label for SOS reports when the client does not send one.
  if (!locationLabel) {
    const barangay = await findBarangayByPoint(input.lng, input.lat, {
      city: "Dagupan City",
      province: "Pangasinan",
    });
    if (barangay) {
      locationLabel = [barangay.name, barangay.city, barangay.province].filter(Boolean).join(", ") || undefined;
    }
  }

  const doc = await EmergencyReport.create({
    emergencyType: "SOS",
    source: "SOS_BUTTON",
    status: "OPEN",
    location: {
      type: "Point",
      coordinates: [input.lng, input.lat],
      accuracy: input.accuracy,
    },
    locationLabel,
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
    .populate("reportedBy", "firstName lastName role username email lguName municipality barangay contactNo lifelineId avatarUrl country postalCode")
    .lean();

  const emergencyIds = docs
    .map((d: any) => d?._id)
    .filter((id: unknown) => Boolean(id));

  const offers = emergencyIds.length
    ? await DispatchOffer.find({ emergencyId: { $in: emergencyIds } })
        .select("emergencyId status")
        .lean()
    : [];

  const offerStatusesByEmergencyId = new Map<string, Set<string>>();
  for (const offer of offers) {
    const emergencyId = String((offer as any)?.emergencyId ?? "").trim();
    if (!emergencyId) continue;

    const statuses = offerStatusesByEmergencyId.get(emergencyId) ?? new Set<string>();
    statuses.add(toStatus((offer as any)?.status));
    offerStatusesByEmergencyId.set(emergencyId, statuses);
  }

  // small in-request cache (prevents repeat lookups for same coords)
  const cache = new Map<string, any>();
  const emptyOfferStatuses = new Set<string>();

  const enriched = await Promise.all(
    docs.map(async (d: any) => {
      const coords = d.location?.coordinates;
      const lng = Array.isArray(coords) ? coords[0] : NaN;
      const lat = Array.isArray(coords) ? coords[1] : NaN;
      const offerStatuses = offerStatusesByEmergencyId.get(String(d?._id)) ?? emptyOfferStatuses;
      const workflowProgress = deriveDashboardWorkflowProgress(d?.status, offerStatuses);

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
        progressLabel: workflowProgress.progressLabel,
        progressPercent: workflowProgress.progressPercent,
      };
    })
  );

  return enriched;
}
