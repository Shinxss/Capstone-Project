import { Types } from "mongoose";
import { VolunteerApplication } from "./volunteerApplication.model";
import { User } from "../users/user.model";

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

  // ✅ Scope LGU to their barangay (if set)
  if (reviewerRole === "LGU") {
    const reviewer = await User.findById(new Types.ObjectId(reviewerId)).select("barangay");
    if (reviewer?.barangay) {
      filter.barangay = reviewer.barangay;
    }
  }

  if (statuses?.length) {
    filter.status = { $in: statuses };
  }

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

  const [items, total] = await Promise.all([
    VolunteerApplication.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    VolunteerApplication.countDocuments(filter),
  ]);

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

  // ✅ Scope LGU to their barangay (if set)
  if (reviewerRole === "LGU") {
    const reviewer = await User.findById(new Types.ObjectId(reviewerId)).select("barangay");
    if (reviewer?.barangay && doc.barangay !== reviewer.barangay) {
      return null;
    }
  }

  return doc;
}