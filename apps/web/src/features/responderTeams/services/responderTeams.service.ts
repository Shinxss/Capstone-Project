import { api } from "@/lib/api";
import type {
  CreateResponderTeamPayload,
  ResponderMemberOption,
  ResponderTeamDetails,
  ResponderTeamLeaderSummary,
  ResponderTeamListItem,
  ResponderTeamsListQuery,
  ResponderTeamsListResponse,
  UpdateResponderTeamPayload,
} from "../models/responderTeam.types";

type ResponderSummaryDto = {
  id: string;
  lifelineId?: string;
  username?: string;
  name: string;
  email?: string;
  barangay?: string;
  onDuty?: boolean;
  isActive?: boolean;
};

type ResponderTeamDto = {
  id: string;
  name: string;
  code?: string;
  description?: string;
  barangay: string;
  municipality: string;
  isActive: boolean;
  memberCount: number;
  memberIds?: string[];
  leader?: ResponderSummaryDto | null;
  members?: ResponderSummaryDto[];
  createdAt: string;
  updatedAt: string;
};

type ResponderAccountOptionDto = {
  id: string;
  lifelineId?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  barangay?: string;
  municipality?: string;
  onDuty?: boolean;
  isActive?: boolean;
};

function safeStr(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function mapLeader(item: ResponderSummaryDto | null | undefined): ResponderTeamLeaderSummary | null {
  if (!item || !safeStr(item.id)) return null;
  return {
    id: item.id,
    lifelineId: safeStr(item.lifelineId) || undefined,
    username: safeStr(item.username) || undefined,
    name: safeStr(item.name) || "Responder",
    email: safeStr(item.email) || undefined,
    onDuty: Boolean(item.onDuty ?? true),
    isActive: Boolean(item.isActive ?? true),
  };
}

function mapTeam(item: ResponderTeamDto): ResponderTeamListItem {
  return {
    id: item.id,
    name: safeStr(item.name),
    code: safeStr(item.code) || undefined,
    description: safeStr(item.description) || undefined,
    barangay: safeStr(item.barangay),
    municipality: safeStr(item.municipality) || "Dagupan City",
    isActive: Boolean(item.isActive),
    memberCount: Number(item.memberCount ?? 0),
    leader: mapLeader(item.leader),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapTeamDetails(item: ResponderTeamDto): ResponderTeamDetails {
  return {
    ...mapTeam(item),
    memberIds: Array.isArray(item.memberIds) ? item.memberIds.map((id) => String(id)) : [],
    members: Array.isArray(item.members)
      ? item.members.map((member) => ({
          id: member.id,
          lifelineId: safeStr(member.lifelineId) || undefined,
          username: safeStr(member.username) || undefined,
          name: safeStr(member.name) || "Responder",
          email: safeStr(member.email) || undefined,
          barangay: safeStr(member.barangay) || undefined,
          onDuty: Boolean(member.onDuty ?? true),
          isActive: Boolean(member.isActive ?? true),
        }))
      : [],
  };
}

function toIsActiveQueryValue(value: ResponderTeamsListQuery["isActive"]) {
  if (value === "active") return "true";
  if (value === "archived") return "false";
  return undefined;
}

export async function listResponderTeams(
  query: ResponderTeamsListQuery
): Promise<ResponderTeamsListResponse> {
  const res = await api.get<{
    items: ResponderTeamDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>("/api/responders/teams", {
    params: {
      q: query.q?.trim() || undefined,
      barangay: query.barangay?.trim() || undefined,
      isActive: toIsActiveQueryValue(query.isActive),
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    },
  });

  return {
    items: (res.data.items ?? []).map(mapTeam),
    pagination: res.data.pagination,
  };
}

export async function getResponderTeam(id: string): Promise<ResponderTeamDetails> {
  const res = await api.get<{ item: ResponderTeamDto }>(`/api/responders/teams/${id}`);
  return mapTeamDetails(res.data.item);
}

export async function createResponderTeam(payload: CreateResponderTeamPayload): Promise<ResponderTeamListItem> {
  const res = await api.post<{ item: ResponderTeamDto }>("/api/responders/teams", payload);
  return mapTeam(res.data.item);
}

export async function updateResponderTeam(
  id: string,
  payload: UpdateResponderTeamPayload
): Promise<ResponderTeamListItem> {
  const res = await api.patch<{ item: ResponderTeamDto }>(`/api/responders/teams/${id}`, payload);
  return mapTeam(res.data.item);
}

export async function archiveResponderTeam(id: string): Promise<ResponderTeamListItem> {
  const res = await api.post<{ item: ResponderTeamDto }>(`/api/responders/teams/${id}/archive`);
  return mapTeam(res.data.item);
}

export async function restoreResponderTeam(id: string): Promise<ResponderTeamListItem> {
  const res = await api.post<{ item: ResponderTeamDto }>(`/api/responders/teams/${id}/restore`);
  return mapTeam(res.data.item);
}

export async function listResponderMemberOptions(params?: {
  q?: string;
  barangay?: string;
  limit?: number;
}): Promise<ResponderMemberOption[]> {
  const requestedLimit = Number(params?.limit);
  const safeLimit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(100, requestedLimit))
    : 100;

  const res = await api.get<{
    items: ResponderAccountOptionDto[];
  }>("/api/responders/accounts", {
    params: {
      q: params?.q?.trim() || undefined,
      barangay: params?.barangay?.trim() || undefined,
      isActive: "true",
      page: 1,
      limit: safeLimit,
    },
  });

  return (res.data.items ?? []).map((item) => {
    const fullName =
      safeStr(item.fullName) ||
      [safeStr(item.firstName), safeStr(item.lastName)].filter(Boolean).join(" ").trim() ||
      safeStr(item.username) ||
      "Responder";

    return {
      id: item.id,
      lifelineId: safeStr(item.lifelineId) || undefined,
      username: safeStr(item.username) || undefined,
      fullName,
      email: safeStr(item.email) || undefined,
      barangay: safeStr(item.barangay),
      municipality: safeStr(item.municipality) || "Dagupan City",
      onDuty: Boolean(item.onDuty ?? true),
      isActive: Boolean(item.isActive ?? true),
    };
  });
}

