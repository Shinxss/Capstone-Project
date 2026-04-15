export type ResponderActorRole = "LGU" | "ADMIN";

export type ResponderActorContext = {
  actorId: string;
  actorRole: ResponderActorRole;
  scopeBarangay?: string;
};

export type ResponderTeamSummary = {
  id: string;
  name: string;
  code?: string;
  isActive?: boolean;
};

export type ResponderAccountListItem = {
  id: string;
  lifelineId?: string;
  username?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  contactNo?: string;
  barangay: string;
  municipality: string;
  skills?: string;
  onDuty: boolean;
  isActive: boolean;
  team?: ResponderTeamSummary | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DispatchableResponderItem = {
  id: string;
  lifelineId?: string;
  name: string;
  status: "available" | "offline";
  skill: string;
  barangay?: string;
  municipality?: string;
  avatarUrl?: string;
  teamId?: string;
  teamName?: string;
};

export class ResponderFeatureError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ResponderFeatureError";
    this.statusCode = statusCode;
  }
}

export function isResponderFeatureError(error: unknown): error is ResponderFeatureError {
  return Boolean(
    error &&
      typeof error === "object" &&
      "statusCode" in error &&
      typeof (error as { statusCode?: unknown }).statusCode === "number"
  );
}
