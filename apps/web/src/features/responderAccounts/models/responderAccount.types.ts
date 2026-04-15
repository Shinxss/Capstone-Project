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
  createdAt: string;
  updatedAt: string;
};

export type ResponderAccountDetails = ResponderAccountListItem & {
  teams?: ResponderTeamSummary[];
};

export type CreateResponderAccountPayload = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email?: string;
  contactNo?: string;
  barangay?: string;
  municipality?: string;
  skills?: string;
  onDuty?: boolean;
  isActive?: boolean;
};

export type UpdateResponderAccountPayload = {
  username?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  contactNo?: string;
  barangay?: string;
  municipality?: string;
  skills?: string;
  onDuty?: boolean;
  isActive?: boolean;
};

export type ResponderAccountsListQuery = {
  q?: string;
  barangay?: string;
  isActive?: "all" | "active" | "suspended";
  onDuty?: "all" | "on" | "off";
  teamId?: string;
  page?: number;
  limit?: number;
};

export type ResponderAccountsListResponse = {
  items: ResponderAccountListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type DispatchableResponder = {
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
