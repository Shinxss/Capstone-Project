import type { VolunteerApplication } from "../models/volunteerApplication.types";

export type VerifiedVolunteerAvailability = "available" | "deployed" | "offline";
export type VerifiedVolunteerAction = "deploy" | "view";

export function resolveVerifiedVolunteerAction(
  availability: VerifiedVolunteerAvailability
): VerifiedVolunteerAction {
  return availability === "available" ? "deploy" : "view";
}

export function resolveVerifiedVolunteerUserId(
  volunteer: Pick<VolunteerApplication, "_id" | "userId">
) {
  const userId = String(volunteer.userId ?? "").trim();
  return userId || String(volunteer._id ?? "").trim();
}

export function buildVolunteerDeploymentPath(volunteerId: string) {
  const searchParams = new URLSearchParams({ deployVolunteerId: volunteerId });
  return `/lgu/live-map?${searchParams.toString()}`;
}
