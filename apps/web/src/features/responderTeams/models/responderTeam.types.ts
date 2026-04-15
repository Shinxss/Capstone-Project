export type ResponderTeamLeaderSummary = {
  id: string;
  lifelineId?: string;
  username?: string;
  name: string;
  email?: string;
  onDuty: boolean;
  isActive: boolean;
};

export type ResponderTeamMemberSummary = {
  id: string;
  lifelineId?: string;
  username?: string;
  name: string;
  email?: string;
  barangay?: string;
  onDuty: boolean;
  isActive: boolean;
};

export type ResponderTeamListItem = {
  id: string;
  name: string;
  code?: string;
  description?: string;
  barangay: string;
  municipality: string;
  isActive: boolean;
  memberCount: number;
  leader: ResponderTeamLeaderSummary | null;
  createdAt: string;
  updatedAt: string;
};

export type ResponderTeamDetails = ResponderTeamListItem & {
  memberIds: string[];
  members: ResponderTeamMemberSummary[];
};

export type CreateResponderTeamPayload = {
  name: string;
  code?: string;
  description?: string;
  barangay?: string;
  municipality?: string;
  leaderId?: string;
  memberIds?: string[];
  isActive?: boolean;
};

export type UpdateResponderTeamPayload = {
  name?: string;
  code?: string;
  description?: string;
  barangay?: string;
  municipality?: string;
  leaderId?: string | null;
  memberIds?: string[];
};

export type ResponderTeamsListQuery = {
  q?: string;
  barangay?: string;
  isActive?: "all" | "active" | "archived";
  page?: number;
  limit?: number;
};

export type ResponderTeamsListResponse = {
  items: ResponderTeamListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ResponderMemberOption = {
  id: string;
  lifelineId?: string;
  username?: string;
  fullName: string;
  email?: string;
  barangay: string;
  municipality: string;
  onDuty: boolean;
  isActive: boolean;
};

