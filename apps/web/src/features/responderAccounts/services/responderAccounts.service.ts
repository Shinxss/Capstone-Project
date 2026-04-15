import { api } from "@/lib/api";
import type {
  CreateResponderAccountPayload,
  DispatchableResponder,
  ResponderAccountDetails,
  ResponderAccountListItem,
  ResponderAccountsListQuery,
  ResponderAccountsListResponse,
  UpdateResponderAccountPayload,
} from "../models/responderAccount.types";

type ResponderTeamSummaryDto = {
  id: string;
  name: string;
  code?: string;
  isActive?: boolean;
};

type ResponderAccountDto = {
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
  team?: ResponderTeamSummaryDto | null;
  teams?: ResponderTeamSummaryDto[];
  createdAt: string;
  updatedAt: string;
};

type DispatchableResponderDto = {
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

function resolveAvatarUrl(value?: string) {
  const avatar = String(value ?? "").trim();
  if (!avatar) return undefined;
  if (/^https?:\/\//i.test(avatar)) return avatar;

  const base = String(api.defaults.baseURL ?? "").trim();
  if (!base) return avatar;

  try {
    const baseUrl = new URL(base);
    const origin = `${baseUrl.protocol}//${baseUrl.host}`;
    return new URL(avatar, origin).toString();
  } catch {
    const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const normalizedPath = avatar.startsWith("/") ? avatar : `/${avatar}`;
    return `${normalizedBase}${normalizedPath}`;
  }
}

function mapResponderAccount(item: ResponderAccountDto): ResponderAccountListItem {
  return {
    id: item.id,
    lifelineId: item.lifelineId,
    username: item.username,
    firstName: item.firstName,
    lastName: item.lastName,
    fullName: item.fullName,
    email: item.email,
    contactNo: item.contactNo,
    barangay: item.barangay,
    municipality: item.municipality,
    skills: item.skills,
    onDuty: item.onDuty,
    isActive: item.isActive,
    team: item.team ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapResponderDetails(item: ResponderAccountDto): ResponderAccountDetails {
  const mapped = mapResponderAccount(item);
  return {
    ...mapped,
    teams: item.teams ?? [],
  };
}

function toBooleanQueryValue(value: ResponderAccountsListQuery["isActive"]) {
  if (value === "active") return "true";
  if (value === "suspended") return "false";
  return undefined;
}

function toOnDutyQueryValue(value: ResponderAccountsListQuery["onDuty"]) {
  if (value === "on") return "true";
  if (value === "off") return "false";
  return undefined;
}

export async function listResponderAccounts(
  query: ResponderAccountsListQuery
): Promise<ResponderAccountsListResponse> {
  const res = await api.get<{
    items: ResponderAccountDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>("/api/responders/accounts", {
    params: {
      q: query.q?.trim() || undefined,
      barangay: query.barangay?.trim() || undefined,
      isActive: toBooleanQueryValue(query.isActive),
      onDuty: toOnDutyQueryValue(query.onDuty),
      teamId: query.teamId || undefined,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    },
  });

  return {
    items: (res.data.items ?? []).map(mapResponderAccount),
    pagination: res.data.pagination,
  };
}

export async function getResponderAccount(id: string): Promise<ResponderAccountDetails> {
  const res = await api.get<{ item: ResponderAccountDto }>(`/api/responders/accounts/${id}`);
  return mapResponderDetails(res.data.item);
}

export async function createResponderAccount(payload: CreateResponderAccountPayload): Promise<ResponderAccountListItem> {
  const res = await api.post<{ item: ResponderAccountDto }>("/api/responders/accounts", payload);
  return mapResponderAccount(res.data.item);
}

export async function updateResponderAccount(
  id: string,
  payload: UpdateResponderAccountPayload
): Promise<ResponderAccountListItem> {
  const res = await api.patch<{ item: ResponderAccountDto }>(`/api/responders/accounts/${id}`, payload);
  return mapResponderAccount(res.data.item);
}

export async function suspendResponderAccount(id: string): Promise<ResponderAccountListItem> {
  const res = await api.post<{ item: ResponderAccountDto }>(`/api/responders/accounts/${id}/suspend`);
  return mapResponderAccount(res.data.item);
}

export async function reactivateResponderAccount(id: string): Promise<ResponderAccountListItem> {
  const res = await api.post<{ item: ResponderAccountDto }>(`/api/responders/accounts/${id}/reactivate`);
  return mapResponderAccount(res.data.item);
}

export async function listDispatchableResponders(params?: {
  q?: string;
  barangay?: string;
  teamId?: string;
  limit?: number;
}): Promise<DispatchableResponder[]> {
  const res = await api.get<{ data: DispatchableResponderDto[] }>(
    "/api/responders/accounts/dispatchable/list",
    {
      params: {
        q: params?.q?.trim() || undefined,
        barangay: params?.barangay?.trim() || undefined,
        teamId: params?.teamId || undefined,
        limit: params?.limit,
      },
    }
  );

  return (res.data.data ?? []).map((item) => ({
    id: item.id,
    lifelineId: item.lifelineId,
    name: item.name,
    status: item.status,
    skill: item.skill,
    barangay: item.barangay,
    municipality: item.municipality,
    avatarUrl: resolveAvatarUrl(item.avatarUrl),
    teamId: item.teamId,
    teamName: item.teamName,
  }));
}
