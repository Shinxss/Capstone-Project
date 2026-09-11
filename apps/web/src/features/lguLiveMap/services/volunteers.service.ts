import { api } from "../../../lib/api";
import type { Volunteer } from "../models/lguLiveMap.types";

type DispatchResponderDTO = {
  id: string;
  lifelineId?: string;
  name: string;
  status: "available" | "busy" | "idle" | "offline";
  skill: string;
  barangay?: string;
  municipality?: string;
  avatarUrl?: string;
  teamId?: string;
  teamName?: string;
  role?: string;
  rating?: number;
  reviewCount?: number;
  etaMinutes?: number;
  recommendationScore?: number;
  recommendationReasons?: string[];
};

type DispatchVolunteerDTO = {
  id: string;
  lifelineId?: string;
  name: string;
  status: "available" | "offline";
  skill: string;
  barangay?: string;
  municipality?: string;
  avatarUrl?: string;
  role?: string;
  rating?: number;
  reviewCount?: number;
  etaMinutes?: number;
  recommendationScore?: number;
  recommendationReasons?: string[];
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

function mapResponderToVolunteer(item: DispatchResponderDTO): Volunteer {
  return {
    id: item.id,
    lifelineId: item.lifelineId,
    name: item.name,
    status: item.status,
    skill: item.skill ?? "General Responder",
    barangayName: item.barangay,
    municipality: item.municipality,
    avatarUrl: resolveAvatarUrl(item.avatarUrl),
    teamName: item.teamName,
    role: item.role,
    rating: item.rating,
    reviewCount: item.reviewCount,
    etaMinutes: item.etaMinutes,
    recommendationScore: item.recommendationScore,
    recommendationReasons: item.recommendationReasons,
  };
}

function mapVolunteerToVolunteer(item: DispatchVolunteerDTO): Volunteer {
  return {
    id: item.id,
    lifelineId: item.lifelineId,
    name: item.name,
    status: item.status,
    skill: item.skill ?? "General Volunteer",
    barangayName: item.barangay,
    municipality: item.municipality,
    avatarUrl: resolveAvatarUrl(item.avatarUrl),
    role: item.role,
    rating: item.rating,
    reviewCount: item.reviewCount,
    etaMinutes: item.etaMinutes,
    recommendationScore: item.recommendationScore,
    recommendationReasons: item.recommendationReasons,
  };
}

async function fetchLegacyDispatchVolunteers(): Promise<Volunteer[]> {
  const res = await api.get<{ data: DispatchVolunteerDTO[] }>("/api/users/volunteers", {
    params: { onlyApproved: true, includeInactive: true },
  });

  return (res.data.data ?? []).map(mapVolunteerToVolunteer);
}

export async function fetchDispatchVolunteers(): Promise<Volunteer[]> {
  const [responderResult, volunteerResult] = await Promise.allSettled([
    api.get<{ data: DispatchResponderDTO[] }>("/api/responders/accounts/dispatchable/list"),
    fetchLegacyDispatchVolunteers(),
  ]);

  if (responderResult.status === "rejected" && volunteerResult.status === "rejected") {
    throw responderResult.reason;
  }

  const responders =
    responderResult.status === "fulfilled"
      ? (responderResult.value.data.data ?? []).map(mapResponderToVolunteer)
      : [];
  const volunteers = volunteerResult.status === "fulfilled" ? volunteerResult.value : [];

  // Presence events contain only an account ID. Keep both account directories in
  // the client so an online volunteer can be matched to their real profile name
  // even when dedicated responder accounts also exist.
  const accountsById = new Map<string, Volunteer>();
  for (const account of [...responders, ...volunteers]) {
    if (!accountsById.has(account.id)) accountsById.set(account.id, account);
  }

  return Array.from(accountsById.values());
}
