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

function safeStr(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeIso(value: unknown): string | undefined {
  if (!value) return undefined;

  const iso = value instanceof Date ? value.toISOString() : safeStr(value);
  return iso || undefined;
}

function toRecentTimestamp(...values: unknown[]): number {
  for (const value of values) {
    const iso = normalizeIso(value);
    if (!iso) continue;

    const ts = Date.parse(iso);
    if (Number.isFinite(ts)) return ts;
  }

  return 0;
}

function pickPreferredApplication(current: any | undefined, candidate: any) {
  if (!candidate) return current;
  if (!current) return candidate;

  const currentIsVerified = normalizeVolunteerApplicationStatus(current?.status) === "verified";
  const candidateIsVerified = normalizeVolunteerApplicationStatus(candidate?.status) === "verified";

  if (candidateIsVerified && !currentIsVerified) return candidate;
  if (currentIsVerified && !candidateIsVerified) return current;

  return toRecentTimestamp(candidate?.createdAt, candidate?.updatedAt) >
    toRecentTimestamp(current?.createdAt, current?.updatedAt)
    ? candidate
    : current;
}

function buildVerifiedVolunteerProfile(user: any, application?: any) {
  const fullNameFromUser = [safeStr(user?.firstName), safeStr(user?.lastName)]
    .filter(Boolean)
    .join(" ");

  return {
    _id: String(user?._id ?? ""),
    userId: String(user?._id ?? ""),
    fullName: safeStr(application?.fullName) || fullNameFromUser || "Verified Volunteer",
    sex: application?.sex ?? "Prefer not to say",
    birthdate: safeStr(application?.birthdate) || safeStr(user?.birthdate),
    mobile: safeStr(application?.mobile) || safeStr(user?.contactNo),
    email: safeStr(application?.email) || safeStr(user?.email),
    street: safeStr(application?.street),
    barangay: safeStr(application?.barangay) || safeStr(user?.barangay),
    city: safeStr(application?.city) || safeStr(user?.municipality),
    province: safeStr(application?.province),
    emergencyContact: {
      name: safeStr(application?.emergencyContact?.name),
      relationship: safeStr(application?.emergencyContact?.relationship),
      mobile: safeStr(application?.emergencyContact?.mobile),
      addressSameAsApplicant: Boolean(application?.emergencyContact?.addressSameAsApplicant),
      address: safeStr(application?.emergencyContact?.address),
    },
    skillsOther: safeStr(application?.skillsOther),
    certificationsText: safeStr(application?.certificationsText),
    availabilityText: safeStr(application?.availabilityText),
    preferredAssignmentText: safeStr(application?.preferredAssignmentText),
    healthNotes: safeStr(application?.healthNotes),
    consent: {
      truth: Boolean(application?.consent?.truth),
      rules: Boolean(application?.consent?.rules),
      data: Boolean(application?.consent?.data),
    },
    status: "verified",
    reviewedBy: application?.reviewedBy ? String(application.reviewedBy) : undefined,
    reviewedAt:
      normalizeIso(application?.reviewedAt) ??
      normalizeIso(user?.updatedAt) ??
      normalizeIso(user?.createdAt),
    reviewNotes: safeStr(application?.reviewNotes),
    createdAt: normalizeIso(application?.createdAt) ?? normalizeIso(user?.createdAt),
    updatedAt: normalizeIso(application?.updatedAt) ?? normalizeIso(user?.updatedAt),
  };
}

function matchesVerifiedVolunteerQuery(profile: any, user: any, q?: string) {
  const query = safeStr(q);
  if (!query) return true;

  const rx = new RegExp(escapeRegExp(query), "i");

  return [
    profile?.fullName,
    profile?.barangay,
    profile?.mobile,
    profile?.email,
    profile?.emergencyContact?.name,
    profile?.preferredAssignmentText,
    profile?.certificationsText,
    profile?.skillsOther,
    user?.firstName,
    user?.lastName,
    user?.email,
    user?.barangay,
    user?.municipality,
    user?.contactNo,
  ].some((value) => rx.test(safeStr(value)));
}

async function findPreferredApplicationForUser(userId: Types.ObjectId | string) {
  const selectFields =
    "userId fullName sex birthdate mobile email street barangay city province emergencyContact skillsOther certificationsText availabilityText preferredAssignmentText healthNotes consent status reviewedBy reviewedAt reviewNotes createdAt updatedAt";

  const [verifiedApplication, latestApplication] = await Promise.all([
    VolunteerApplication.findOne({
      userId,
      status: { $in: expandVolunteerApplicationStatuses(["verified"]) },
    })
      .select(selectFields)
      .sort({ createdAt: -1 })
      .lean(),
    VolunteerApplication.findOne({ userId }).select(selectFields).sort({ createdAt: -1 }).lean(),
  ]);

  return verifiedApplication ?? latestApplication ?? null;
}

async function listVerifiedVolunteerProfilesForReviewer(params: {
  reviewerId: string;
  reviewerRole: string;
  q?: string;
  page: number;
  limit: number;
}) {
  const { q, page, limit } = params;

  const approvedUsers = await User.find({
    volunteerStatus: "APPROVED",
    isActive: true,
    role: { $in: ["VOLUNTEER", "COMMUNITY"] },
  })
    .select(
      "_id firstName lastName email barangay municipality birthdate contactNo role volunteerStatus isActive createdAt updatedAt"
    )
    .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
    .lean();

  if (approvedUsers.length === 0) {
    return { items: [], total: 0, page, limit };
  }

  const userIds = approvedUsers.map((user: any) => user._id as Types.ObjectId);
  const applications = await VolunteerApplication.find({ userId: { $in: userIds } })
    .select(
      "userId fullName sex birthdate mobile email street barangay city province emergencyContact skillsOther certificationsText availabilityText preferredAssignmentText healthNotes consent status reviewedBy reviewedAt reviewNotes createdAt updatedAt"
    )
    .sort({ createdAt: -1, updatedAt: -1, _id: -1 })
    .lean();

  const preferredApplications = new Map<string, any>();
  for (const application of applications) {
    const key = String((application as any)?.userId ?? "");
    preferredApplications.set(
      key,
      pickPreferredApplication(preferredApplications.get(key), application)
    );
  }

  const profiles = approvedUsers
    .map((user: any) => {
      const key = String(user?._id ?? "");
      const application = preferredApplications.get(key);
      const profile = buildVerifiedVolunteerProfile(user, application);
      if (!matchesVerifiedVolunteerQuery(profile, user, q)) return null;

      return profile;
    })
    .filter(Boolean)
    .sort(
      (a: any, b: any) =>
        toRecentTimestamp(b?.reviewedAt, b?.updatedAt, b?.createdAt) -
        toRecentTimestamp(a?.reviewedAt, a?.updatedAt, a?.createdAt)
    );

  const total = profiles.length;
  const skip = (page - 1) * limit;

  return {
    items: profiles.slice(skip, skip + limit),
    total,
    page,
    limit,
  };
}

async function getVerifiedVolunteerProfileForReviewer(params: {
  reviewerId: string;
  reviewerRole: string;
  userId: string;
}) {
  const { userId } = params;

  const user = await User.findById(userId)
    .select(
      "_id firstName lastName email barangay municipality birthdate contactNo role volunteerStatus isActive createdAt updatedAt"
    )
    .lean();

  if (!user || user.isActive !== true || user.volunteerStatus !== "APPROVED") {
    return null;
  }

  const application = await findPreferredApplicationForUser(String(user._id));

  return buildVerifiedVolunteerProfile(user, application);
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

  const requestedStatuses = statuses?.length
    ? Array.from(new Set(statuses.map((s) => normalizeVolunteerApplicationStatus(s))))
    : undefined;

  if (requestedStatuses?.length === 1 && requestedStatuses[0] === "verified") {
    return listVerifiedVolunteerProfilesForReviewer({
      reviewerId,
      reviewerRole,
      q,
      page,
      limit,
    });
  }

  const filter: any = {};
  const appStatusAliases = requestedStatuses?.length
    ? expandVolunteerApplicationStatuses(requestedStatuses)
    : undefined;

  if (q) {
    const rx = new RegExp(escapeRegExp(q), "i");
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

  if (appStatusAliases?.length) {
    const statusOrUserStatusMatch: any[] = [{ status: { $in: appStatusAliases } }];

    if (requestedStatuses?.includes("pending_verification")) {
      statusOrUserStatusMatch.push({ "user.volunteerStatus": "PENDING" });
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
  if (!doc) {
    return getVerifiedVolunteerProfileForReviewer({
      reviewerId,
      reviewerRole,
      userId: applicationId,
    });
  }

  const linkedUser = await User.findById(doc.userId).select("_id isActive barangay").lean();
  if (!linkedUser || linkedUser.isActive !== true) {
    return null;
  }

  (doc as any).status = normalizeVolunteerApplicationStatus((doc as any).status);

  return doc;
}
