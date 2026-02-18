import { Types } from "mongoose";
import { VolunteerApplication } from "./volunteerApplication.model";
import { User } from "../users/user.model";

function normalizeVolunteerApplicationStatus(status: unknown): string {
  const raw = String(status ?? "").trim().toLowerCase().replace(/-/g, "_");

  if (raw === "pending" || raw === "pending_verification") return "pending_verification";
  if (raw === "needs_info" || raw === "need_info") return "needs_info";
  if (raw === "verified" || raw === "approved") return "verified";
  if (raw === "rejected" || raw === "denied") return "rejected";

  return String(status ?? "");
}

function expandVolunteerApplicationStatuses(statuses: string[]): string[] {
  const expanded = new Set<string>();

  for (const status of statuses) {
    const normalized = normalizeVolunteerApplicationStatus(status);
    expanded.add(normalized);

    if (normalized === "pending_verification") {
      expanded.add("PENDING");
      expanded.add("pending");
      expanded.add("PENDING_VERIFICATION");
    }
    if (normalized === "needs_info") {
      expanded.add("NEEDS_INFO");
      expanded.add("needs-info");
    }
    if (normalized === "verified") {
      expanded.add("VERIFIED");
      expanded.add("APPROVED");
    }
    if (normalized === "rejected") {
      expanded.add("REJECTED");
      expanded.add("DENIED");
    }
  }

  return Array.from(expanded);
}

export async function submitVolunteerApplication(userId: string, payload: any) {
  const userObjectId = new Types.ObjectId(userId);

  // Prevent multiple active applications under review
  const existing = await VolunteerApplication.findOne({
    userId: userObjectId,
    status: { $in: ["pending_verification", "needs_info"] },
  });

  if (existing) {
    throw new Error("You already have an application under review.");
  }

  const created = await VolunteerApplication.create({
    userId: userObjectId,
    ...payload,
    status: "pending_verification",
  });

  // Update user volunteer status to PENDING (if not already APPROVED)
  await User.findByIdAndUpdate(userObjectId, {
    $set: { volunteerStatus: "PENDING" },
  });

  return created;
}

export async function getMyLatestApplication(userId: string) {
  const userObjectId = new Types.ObjectId(userId);
  return VolunteerApplication.findOne({ userId: userObjectId }).sort({ createdAt: -1 });
}

export async function reviewVolunteerApplication(params: {
  applicationId: string;
  reviewerId: string;
  action: "needs_info" | "verified" | "rejected";
  notes?: string;
}) {
  const { applicationId, reviewerId, action, notes } = params;

  const updated = await VolunteerApplication.findByIdAndUpdate(
    applicationId,
    {
      status: action,
      reviewedBy: new Types.ObjectId(reviewerId),
      reviewedAt: new Date(),
      reviewNotes: notes ?? "",
    },
    { new: true }
  );

  if (!updated) return null;

  // Sync user status when LGU/Admin verifies/rejects
  if (action === "verified") {
    const user = await User.findById(updated.userId);
    if (user) {
      const nextRole = user.role === "COMMUNITY" ? "VOLUNTEER" : user.role;
      await User.findByIdAndUpdate(updated.userId, {
        $set: { volunteerStatus: "APPROVED", role: nextRole },
      });
    }
  }

  if (action === "rejected") {
    await User.findByIdAndUpdate(updated.userId, {
      $set: { volunteerStatus: "NONE" },
    });
  }

  return updated;
}

export async function listVolunteerApplicationsForReviewer(params: {
  reviewerId: string;
  reviewerRole: string;
  statuses?: string[];
  q?: string;
  page: number;
  limit: number;
}) {
  const { reviewerId, reviewerRole, statuses, q, page, limit } = params;

  const filter: any = {};
  let reviewerBarangay = "";

  // ✅ Scope LGU to their barangay (if set)
  if (reviewerRole === "LGU") {
    const reviewer = await User.findById(new Types.ObjectId(reviewerId)).select("barangay");
    reviewerBarangay = String(reviewer?.barangay ?? "").trim();
  }

  const requestedStatuses = statuses?.length
    ? Array.from(new Set(statuses.map((s) => normalizeVolunteerApplicationStatus(s))))
    : undefined;
  const appStatusAliases = requestedStatuses?.length
    ? expandVolunteerApplicationStatuses(requestedStatuses)
    : undefined;

  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { fullName: rx },
      { barangay: rx },
      { mobile: rx },
      { "emergencyContact.name": rx },
    ];
  }

  const skip = (page - 1) * limit;

  const basePipeline: any[] = [
    { $match: filter },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    { $match: { "user.isActive": true } },
  ];

  if (reviewerBarangay) {
    const reviewerBarangayRegex = new RegExp(
      `^${reviewerBarangay.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      "i"
    );
    basePipeline.push({
      $match: {
        $or: [{ barangay: reviewerBarangayRegex }, { "user.barangay": reviewerBarangayRegex }],
      },
    });
  }

  if (appStatusAliases?.length) {
    const userVolunteerStatuses = new Set<string>();

    if (requestedStatuses?.includes("pending_verification")) {
      userVolunteerStatuses.add("PENDING");
    }
    if (requestedStatuses?.includes("verified")) {
      userVolunteerStatuses.add("APPROVED");
    }

    const statusOrUserStatusMatch: any[] = [{ status: { $in: appStatusAliases } }];
    if (userVolunteerStatuses.size > 0) {
      statusOrUserStatusMatch.push({
        "user.volunteerStatus": { $in: Array.from(userVolunteerStatuses) },
      });
    }

    basePipeline.push({ $match: { $or: statusOrUserStatusMatch } });
  }

  const [itemsRaw, totalRaw] = await Promise.all([
    VolunteerApplication.aggregate([
      ...basePipeline,
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      { $project: { user: 0 } },
    ]),
    VolunteerApplication.aggregate([...basePipeline, { $count: "total" }]),
  ]);

  const items = (itemsRaw ?? []).map((item: any) => ({
    ...item,
    status: normalizeVolunteerApplicationStatus(item?.status),
  }));
  const total = Number(totalRaw?.[0]?.total ?? 0);

  return { items, total, page, limit };
}

export async function getVolunteerApplicationByIdForReviewer(params: {
  reviewerId: string;
  reviewerRole: string;
  applicationId: string;
}) {
  const { reviewerId, reviewerRole, applicationId } = params;

  const doc = await VolunteerApplication.findById(applicationId);
  if (!doc) return null;

  const linkedUser = await User.findById(doc.userId).select("_id isActive barangay").lean();
  if (!linkedUser || linkedUser.isActive !== true) {
    return null;
  }

  // ✅ Scope LGU to their barangay (if set)
  if (reviewerRole === "LGU") {
    const reviewer = await User.findById(new Types.ObjectId(reviewerId)).select("barangay");
    const reviewerBarangay = String(reviewer?.barangay ?? "").trim().toLowerCase();
    const appBarangay = String((doc as any).barangay ?? "").trim().toLowerCase();
    const userBarangay = String((linkedUser as any).barangay ?? "").trim().toLowerCase();
    if (reviewerBarangay && appBarangay !== reviewerBarangay && userBarangay !== reviewerBarangay) {
      return null;
    }
  }

  (doc as any).status = normalizeVolunteerApplicationStatus((doc as any).status);

  return doc;
}