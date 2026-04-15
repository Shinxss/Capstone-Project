import { api } from "../../../lib/api";
import type { Volunteer } from "../models/lguLiveMap.types";

type DispatchResponderDTO = {
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

type DispatchVolunteerDTO = {
  id: string;
  lifelineId?: string;
  name: string;
  status: "available" | "offline";
  skill: string;
  barangay?: string;
  municipality?: string;
  avatarUrl?: string;
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
  };
}

async function fetchLegacyDispatchVolunteers(): Promise<Volunteer[]> {
  const res = await api.get<{ data: DispatchVolunteerDTO[] }>("/api/users/volunteers", {
    params: { onlyApproved: true, includeInactive: true },
  });

  return (res.data.data ?? []).map(mapVolunteerToVolunteer);
}

export async function fetchDispatchVolunteers(): Promise<Volunteer[]> {
  try {
    const responderRes = await api.get<{ data: DispatchResponderDTO[] }>(
      "/api/responders/accounts/dispatchable/list"
    );

    const responders = (responderRes.data.data ?? []).map(mapResponderToVolunteer);
    if (responders.length > 0) {
      return responders;
    }

    // Backward-compatible fallback:
    // if no responder accounts exist yet, keep volunteer dispatch source available
    // so legacy LGU environments can still dispatch while migrating.
    return fetchLegacyDispatchVolunteers();
  } catch (responderError) {
    try {
      return await fetchLegacyDispatchVolunteers();
    } catch {
      throw responderError;
    }
  }
}
