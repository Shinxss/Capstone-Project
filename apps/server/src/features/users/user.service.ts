import { Types } from "mongoose";
import { User } from "./user.model";
import { VolunteerApplication } from "../volunteerApplications/volunteerApplication.model";

export type DispatchVolunteer = {
  id: string;
  name: string;
  status: "available" | "offline";
  skill: string;
  barangay?: string;
  municipality?: string;
};

export type ListDispatchVolunteersParams = {
  onlyApproved?: boolean;
  includeInactive?: boolean;
};

function safeStr(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function listDispatchVolunteers(
  params: ListDispatchVolunteersParams = {}
): Promise<DispatchVolunteer[]> {
  const { onlyApproved = true, includeInactive = true } = params;

  const match: Record<string, any> = { role: "VOLUNTEER" };
  if (onlyApproved) match.volunteerStatus = "APPROVED";
  if (!includeInactive) match.isActive = true;

  const users = await User.find(match)
    .select("_id firstName lastName isActive barangay municipality")
    .sort({ createdAt: -1 })
    .lean();

  if (users.length === 0) return [];

  const userIds = users.map((u: any) => u._id as Types.ObjectId);

  // Optional enrichment: get latest VERIFIED volunteer application per user for skills/address
  const applications = await VolunteerApplication.find({
    userId: { $in: userIds },
    status: "verified",
  })
    .select("userId skillsOther barangay city")
    .sort({ createdAt: -1 })
    .lean();

  const appByUserId = new Map<string, any>();
  for (const app of applications) {
    const key = String((app as any).userId);
    if (!appByUserId.has(key)) appByUserId.set(key, app);
  }

  return users.map((u: any) => {
    const id = String(u._id);
    const app = appByUserId.get(id);

    const name = [safeStr(u.firstName), safeStr(u.lastName)].filter(Boolean).join(" ") || "Volunteer";
    const skill = safeStr(app?.skillsOther) || "General Volunteer";

    const barangay = safeStr(app?.barangay) || safeStr(u.barangay) || undefined;
    const municipality = safeStr(app?.city) || safeStr(u.municipality) || undefined;

    return {
      id,
      name,
      status: u.isActive ? "available" : "offline",
      skill,
      barangay,
      municipality,
    };
  });
}
