import type { Volunteer } from "../models/lguLiveMap.types";

export const DEPLOY_VOLUNTEER_QUERY_PARAM = "deployVolunteerId";

export type DeploymentIntentViewModel = {
  volunteerId: string;
  volunteerName: string;
};

export type DeploymentIntentResolution =
  | { kind: "none" }
  | { kind: "waiting" }
  | { kind: "missing"; volunteerId: string }
  | { kind: "unavailable"; volunteer: Volunteer }
  | { kind: "ready"; volunteer: Volunteer; intent: DeploymentIntentViewModel };

export function resolveDeploymentIntent(
  volunteers: Volunteer[],
  volunteerId: string | null,
  volunteersReady: boolean
): DeploymentIntentResolution {
  if (!volunteerId) return { kind: "none" };
  if (!volunteersReady) return { kind: "waiting" };

  const volunteer = volunteers.find((item) => item.id === volunteerId);
  if (!volunteer) return { kind: "missing", volunteerId };
  if (volunteer.status !== "available") return { kind: "unavailable", volunteer };

  return {
    kind: "ready",
    volunteer,
    intent: {
      volunteerId: volunteer.id,
      volunteerName: volunteer.name,
    },
  };
}

export function removeDeploymentIntentParam(searchParams: URLSearchParams) {
  const next = new URLSearchParams(searchParams);
  next.delete(DEPLOY_VOLUNTEER_QUERY_PARAM);
  return next;
}

export type DeploymentModalAction =
  | { kind: "wait" }
  | { kind: "already-assigned" }
  | { kind: "open"; selectedIds: string[] };

export function resolveDeploymentModalAction(params: {
  volunteerId: string;
  selectedEmergencyId: string | null;
  hasEmergencyDetails: boolean;
  tasksLoading: boolean;
  tasksError: string | null;
  tasksLoadedEmergencyId: string | null;
  assignedIds: ReadonlySet<string>;
}): DeploymentModalAction {
  if (
    !params.selectedEmergencyId ||
    !params.hasEmergencyDetails ||
    params.tasksLoading ||
    params.tasksError ||
    params.tasksLoadedEmergencyId !== params.selectedEmergencyId
  ) {
    return { kind: "wait" };
  }

  if (params.assignedIds.has(params.volunteerId)) {
    return { kind: "already-assigned" };
  }

  return { kind: "open", selectedIds: [params.volunteerId] };
}
