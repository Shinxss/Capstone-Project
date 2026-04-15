import { Types } from "mongoose";
import { User } from "../users/user.model";
import { ResponderTeam } from "./responderTeam.model";
import type {
  CreateResponderTeamInput,
  ListResponderTeamsQuery,
  UpdateResponderTeamInput,
} from "./responderTeam.validation";
import { ResponderFeatureError, type ResponderActorContext } from "../responders/responder.types";
import { resolveResponderActorContext } from "../responders/responder.service";

const DEFAULT_MUNICIPALITY = "Dagupan City";

type LeanTeamRow = {
  _id: Types.ObjectId;
  name?: string;
  code?: string;
  description?: string;
  barangay?: string;
  municipality?: string;
  leaderId?: Types.ObjectId;
  memberIds?: Types.ObjectId[];
  isActive?: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

type LeanResponderUserSummary = {
  _id: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  lifelineId?: string;
  username?: string;
  email?: string;
  role?: string;
  barangay?: string;
  isActive?: boolean;
  onDuty?: boolean;
};

type TeamMembershipChange = {
  reassignedResponderIds: string[];
  affectedTeamIds: string[];
};

function safeStr(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ensureObjectId(value: string, message = "Invalid ObjectId") {
  const id = safeStr(value);
  if (!Types.ObjectId.isValid(id)) {
    throw new ResponderFeatureError(message, 400);
  }
  return new Types.ObjectId(id);
}

function toObjectIds(values: string[]) {
  return values
    .map((value) => safeStr(value))
    .filter((value) => Types.ObjectId.isValid(value))
    .map((value) => new Types.ObjectId(value));
}

function toUniqueMemberIdsWithValidation(values: string[] | undefined) {
  const normalized = (values ?? []).map((value) => safeStr(value)).filter(Boolean);
  const seen = new Set<string>();
  const unique: string[] = [];
  let duplicate = false;

  for (const value of normalized) {
    if (!Types.ObjectId.isValid(value)) {
      throw new ResponderFeatureError("memberIds contains invalid ObjectId", 400);
    }

    if (seen.has(value)) {
      duplicate = true;
      continue;
    }

    seen.add(value);
    unique.push(value);
  }

  if (duplicate) {
    throw new ResponderFeatureError("Duplicate memberIds are not allowed.", 400);
  }

  return unique;
}

function normalizeLeaderId(value: string | null | undefined) {
  if (value === null) return null;

  const normalized = safeStr(value);
  if (!normalized) return undefined;
  if (!Types.ObjectId.isValid(normalized)) {
    throw new ResponderFeatureError("leaderId must be a valid ObjectId.", 400);
  }

  return normalized;
}

function memberName(user: {
  firstName?: unknown;
  lastName?: unknown;
  username?: unknown;
  email?: unknown;
}) {
  const fullName = [safeStr(user.firstName), safeStr(user.lastName)].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;

  const username = safeStr(user.username);
  if (username) return username;

  return safeStr(user.email) || "Responder";
}

function normalizeTeamPayloadForResponse(
  team: LeanTeamRow,
  usersById: Map<string, LeanResponderUserSummary>
) {
  const leaderId = team.leaderId ? String(team.leaderId) : "";
  const leader = leaderId ? usersById.get(leaderId) : undefined;

  const memberIds = (team.memberIds ?? []).map((memberId) => String(memberId)).filter(Boolean);
  const members = memberIds
    .map((memberId) => usersById.get(memberId))
    .filter((member): member is LeanResponderUserSummary => Boolean(member))
    .map((member) => ({
      id: String(member._id),
      lifelineId: safeStr(member.lifelineId) || undefined,
      username: safeStr(member.username) || undefined,
      name: memberName(member),
      email: safeStr(member.email) || undefined,
      barangay: safeStr(member.barangay) || undefined,
      isActive: Boolean(member.isActive ?? true),
      onDuty: Boolean(member.onDuty ?? true),
    }));

  return {
    id: String(team._id),
    name: safeStr(team.name),
    code: safeStr(team.code) || undefined,
    description: safeStr(team.description) || undefined,
    barangay: safeStr(team.barangay),
    municipality: safeStr(team.municipality) || DEFAULT_MUNICIPALITY,
    isActive: Boolean(team.isActive ?? true),
    memberCount: memberIds.length,
    memberIds,
    leader: leader
      ? {
          id: String(leader._id),
          lifelineId: safeStr(leader.lifelineId) || undefined,
          username: safeStr(leader.username) || undefined,
          name: memberName(leader),
          email: safeStr(leader.email) || undefined,
          onDuty: Boolean(leader.onDuty ?? true),
          isActive: Boolean(leader.isActive ?? true),
        }
      : null,
    members,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
  };
}

async function buildUsersById(ids: string[]) {
  const objectIds = toObjectIds(ids);
  if (objectIds.length === 0) {
    return new Map<string, LeanResponderUserSummary>();
  }

  const users = await User.find({
    _id: { $in: objectIds },
  })
    .select("_id firstName lastName lifelineId username email role barangay onDuty isActive")
    .lean<LeanResponderUserSummary[]>();

  const map = new Map<string, LeanResponderUserSummary>();
  for (const user of users) {
    map.set(String(user._id), user);
  }
  return map;
}

async function ensureTeamNameUniqueAmongActive(params: {
  teamIdToExclude?: string;
  name: string;
  barangay: string;
  municipality: string;
}) {
  const name = safeStr(params.name);
  const barangay = safeStr(params.barangay);
  const municipality = safeStr(params.municipality) || DEFAULT_MUNICIPALITY;
  if (!name || !barangay) {
    throw new ResponderFeatureError("name and barangay are required.", 400);
  }

  const existing = await ResponderTeam.findOne({
    ...(params.teamIdToExclude && Types.ObjectId.isValid(params.teamIdToExclude)
      ? { _id: { $ne: new Types.ObjectId(params.teamIdToExclude) } }
      : {}),
    barangay,
    municipality,
    isActive: true,
    name: new RegExp(`^${escapeRegExp(name)}$`, "i"),
  })
    .select("_id")
    .lean();

  if (existing) {
    throw new ResponderFeatureError("Team name already exists in this barangay.", 409);
  }
}

async function validateResponderMembers(params: {
  memberIds: string[];
  leaderId?: string | null;
  teamBarangay: string;
}) {
  const memberIds = params.memberIds;
  const teamBarangay = safeStr(params.teamBarangay);

  if (!teamBarangay) {
    throw new ResponderFeatureError("barangay is required.", 400);
  }

  if (memberIds.length === 0) {
    if (params.leaderId) {
      throw new ResponderFeatureError("leaderId must also exist in memberIds.", 400);
    }

    return [] as LeanResponderUserSummary[];
  }

  const responders = await User.find({
    _id: { $in: toObjectIds(memberIds) },
    role: "RESPONDER",
  })
    .select("_id firstName lastName lifelineId username email role barangay isActive onDuty")
    .lean<LeanResponderUserSummary[]>();

  const respondersById = new Map<string, LeanResponderUserSummary>();
  for (const responder of responders) {
    respondersById.set(String(responder._id), responder);
  }

  for (const memberId of memberIds) {
    const responder = respondersById.get(memberId);
    if (!responder) {
      throw new ResponderFeatureError("Only RESPONDER users can be team members.", 400);
    }

    const responderBarangay = safeStr(responder.barangay);
    if (responderBarangay !== teamBarangay) {
      throw new ResponderFeatureError(
        "All team members must belong to the same barangay as the team.",
        400
      );
    }
  }

  if (params.leaderId && !memberIds.includes(params.leaderId)) {
    throw new ResponderFeatureError("leaderId must also exist in memberIds.", 400);
  }

  return responders;
}

function buildScopedTeamFilter(actor: ResponderActorContext, teamId?: string) {
  const filter: Record<string, unknown> = {};
  if (teamId) {
    filter._id = ensureObjectId(teamId, "Invalid team id");
  }

  if (actor.actorRole === "LGU") {
    filter.barangay = actor.scopeBarangay;
  }

  return filter;
}

async function moveMembersFromOtherActiveTeams(params: {
  targetTeamId: string;
  memberIds: string[];
  actorId: string;
}) {
  const targetTeamId = safeStr(params.targetTeamId);
  if (!Types.ObjectId.isValid(targetTeamId) || params.memberIds.length === 0) {
    return {
      reassignedResponderIds: [] as string[],
      affectedTeamIds: [] as string[],
    };
  }

  const memberSet = new Set(params.memberIds.map((id) => safeStr(id)).filter(Boolean));
  if (memberSet.size === 0) {
    return {
      reassignedResponderIds: [] as string[],
      affectedTeamIds: [] as string[],
    };
  }

  const otherTeams = await ResponderTeam.find({
    _id: { $ne: new Types.ObjectId(targetTeamId) },
    isActive: true,
    memberIds: { $in: Array.from(memberSet).map((id) => new Types.ObjectId(id)) },
  })
    .select("_id memberIds leaderId")
    .lean();

  const affectedTeamIds: string[] = [];
  for (const team of otherTeams) {
    const teamId = String(team._id);
    const existingMemberIds = (team.memberIds ?? []).map((id: Types.ObjectId | string) =>
      String(id)
    );
    const remainingMemberIds = existingMemberIds.filter((id: string) => !memberSet.has(id));

    if (remainingMemberIds.length === existingMemberIds.length) continue;

    const nextLeaderId = safeStr(team.leaderId ? String(team.leaderId) : "");
    const isLeaderRemoved = nextLeaderId ? !remainingMemberIds.includes(nextLeaderId) : false;

    const update: {
      $set: Record<string, unknown>;
      $unset?: Record<string, unknown>;
    } = {
      $set: {
        memberIds: remainingMemberIds.map((id: string) => new Types.ObjectId(id)),
        updatedBy: new Types.ObjectId(params.actorId),
      },
    };

    if (isLeaderRemoved) {
      if (remainingMemberIds.length > 0) {
        update.$set.leaderId = new Types.ObjectId(remainingMemberIds[0]);
      } else {
        update.$unset = { leaderId: 1 };
      }
    }

    await ResponderTeam.updateOne({ _id: team._id }, update);
    affectedTeamIds.push(teamId);
  }

  return {
    reassignedResponderIds: Array.from(memberSet),
    affectedTeamIds,
  };
}

async function readTeamForActorOrThrow(params: {
  actor: ResponderActorContext;
  teamId: string;
}) {
  const team = await ResponderTeam.findOne(buildScopedTeamFilter(params.actor, params.teamId))
    .select(
      "_id name code description barangay municipality leaderId memberIds isActive createdBy updatedBy createdAt updatedAt"
    )
    .lean<LeanTeamRow | null>();

  if (!team) {
    throw new ResponderFeatureError("Responder team not found", 404);
  }

  return team;
}

async function normalizeTeamResponse(team: LeanTeamRow) {
  const ids = new Set<string>();
  if (team.leaderId) ids.add(String(team.leaderId));
  for (const memberId of team.memberIds ?? []) ids.add(String(memberId));

  const usersById = await buildUsersById(Array.from(ids));
  return normalizeTeamPayloadForResponse(team, usersById);
}

export async function listResponderTeamsForActor(params: {
  actorId: string;
  actorRole: string;
  query: ListResponderTeamsQuery;
}) {
  const actor = await resolveResponderActorContext({
    actorId: params.actorId,
    actorRole: params.actorRole,
  });

  const filter: Record<string, unknown> = buildScopedTeamFilter(actor);

  if (params.query.isActive === "true" || params.query.isActive === "false") {
    filter.isActive = params.query.isActive === "true";
  }

  const requestedBarangay = safeStr(params.query.barangay);
  if (requestedBarangay) {
    if (actor.actorRole === "LGU" && requestedBarangay !== actor.scopeBarangay) {
      return {
        items: [],
        pagination: {
          page: params.query.page,
          limit: params.query.limit,
          total: 0,
          totalPages: 1,
        },
      };
    }

    filter.barangay = requestedBarangay;
  }

  const q = safeStr(params.query.q);
  if (q) {
    const regex = new RegExp(escapeRegExp(q), "i");
    filter.$or = [{ name: regex }, { code: regex }, { description: regex }, { barangay: regex }];
  }

  const [rows, total] = await Promise.all([
    ResponderTeam.find(filter)
      .select("_id name code description barangay municipality leaderId memberIds isActive createdAt updatedAt")
      .sort({ updatedAt: -1, _id: -1 })
      .skip((params.query.page - 1) * params.query.limit)
      .limit(params.query.limit)
      .lean<LeanTeamRow[]>(),
    ResponderTeam.countDocuments(filter),
  ]);

  const userIds = Array.from(
    new Set(
      rows
        .map((row) => (row.leaderId ? String(row.leaderId) : ""))
        .filter(Boolean)
    )
  );
  const usersById = await buildUsersById(userIds);

  const items = rows.map((row) => {
    const leaderId = row.leaderId ? String(row.leaderId) : "";
    const leader = leaderId ? usersById.get(leaderId) : undefined;

    return {
      id: String(row._id),
      name: safeStr(row.name),
      code: safeStr(row.code) || undefined,
      description: safeStr(row.description) || undefined,
      barangay: safeStr(row.barangay),
      municipality: safeStr(row.municipality) || DEFAULT_MUNICIPALITY,
      isActive: Boolean(row.isActive ?? true),
      memberCount: Array.isArray(row.memberIds) ? row.memberIds.length : 0,
      leader: leader
        ? {
            id: String(leader._id),
            lifelineId: safeStr(leader.lifelineId) || undefined,
            username: safeStr(leader.username) || undefined,
            name: memberName(leader),
            email: safeStr(leader.email) || undefined,
            onDuty: Boolean(leader.onDuty ?? true),
            isActive: Boolean(leader.isActive ?? true),
          }
        : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  });

  return {
    items,
    pagination: {
      page: params.query.page,
      limit: params.query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.query.limit)),
    },
  };
}

export async function getResponderTeamByIdForActor(params: {
  actorId: string;
  actorRole: string;
  teamId: string;
}) {
  const actor = await resolveResponderActorContext({
    actorId: params.actorId,
    actorRole: params.actorRole,
  });

  const team = await readTeamForActorOrThrow({
    actor,
    teamId: params.teamId,
  });

  return normalizeTeamResponse(team);
}

export async function createResponderTeamForActor(params: {
  actorId: string;
  actorRole: string;
  payload: CreateResponderTeamInput;
}) {
  const actor = await resolveResponderActorContext({
    actorId: params.actorId,
    actorRole: params.actorRole,
  });

  const payload = params.payload;
  const isActive = payload.isActive ?? true;

  const name = safeStr(payload.name);
  if (!name) {
    throw new ResponderFeatureError("name is required.", 400);
  }

  const barangay =
    actor.actorRole === "LGU" ? actor.scopeBarangay || "" : safeStr(payload.barangay);
  if (!barangay) {
    throw new ResponderFeatureError("barangay is required.", 400);
  }

  const municipality = safeStr(payload.municipality) || DEFAULT_MUNICIPALITY;
  const memberIds = toUniqueMemberIdsWithValidation(payload.memberIds);
  const leaderId = normalizeLeaderId(payload.leaderId);

  if (!isActive && memberIds.length > 0) {
    throw new ResponderFeatureError(
      "Archived teams cannot be created with active member assignments.",
      400
    );
  }

  await validateResponderMembers({
    memberIds,
    leaderId: leaderId ?? undefined,
    teamBarangay: barangay,
  });

  if (isActive) {
    await ensureTeamNameUniqueAmongActive({
      name,
      barangay,
      municipality,
    });
  }

  let created: LeanTeamRow;
  try {
    const inserted = await ResponderTeam.create({
      name,
      code: safeStr(payload.code),
      description: safeStr(payload.description),
      barangay,
      municipality,
      leaderId: leaderId ? new Types.ObjectId(leaderId) : undefined,
      memberIds: toObjectIds(memberIds),
      isActive,
      createdBy: new Types.ObjectId(actor.actorId),
      updatedBy: new Types.ObjectId(actor.actorId),
    });

    created = inserted.toObject() as LeanTeamRow;
  } catch (error) {
    const typed = error as { code?: unknown; message?: unknown };
    const duplicate = typed?.code === 11000 || String(typed?.message ?? "").includes("E11000");
    if (duplicate) {
      throw new ResponderFeatureError("Team name already exists in this barangay.", 409);
    }
    throw error;
  }

  const membershipChange =
    isActive && memberIds.length > 0
      ? await moveMembersFromOtherActiveTeams({
          targetTeamId: String(created._id),
          memberIds,
          actorId: actor.actorId,
        })
      : {
          reassignedResponderIds: [] as string[],
          affectedTeamIds: [] as string[],
        };

  const normalized = await normalizeTeamResponse(created);
  return {
    item: normalized,
    membershipChange,
  };
}

export async function updateResponderTeamForActor(params: {
  actorId: string;
  actorRole: string;
  teamId: string;
  payload: UpdateResponderTeamInput;
}) {
  const actor = await resolveResponderActorContext({
    actorId: params.actorId,
    actorRole: params.actorRole,
  });

  const payload = params.payload;
  const teamId = safeStr(params.teamId);
  if (!Types.ObjectId.isValid(teamId)) {
    throw new ResponderFeatureError("Invalid team id", 400);
  }

  const existing = await readTeamForActorOrThrow({ actor, teamId });

  if (
    !existing.isActive &&
    (payload.memberIds !== undefined || payload.leaderId !== undefined)
  ) {
    throw new ResponderFeatureError("Cannot update members of an archived team. Restore it first.", 400);
  }

  const nextName = payload.name !== undefined ? safeStr(payload.name) : safeStr(existing.name);
  const nextCode = payload.code !== undefined ? safeStr(payload.code) : safeStr(existing.code);
  const nextDescription =
    payload.description !== undefined ? safeStr(payload.description) : safeStr(existing.description);

  const requestedBarangay = payload.barangay !== undefined ? safeStr(payload.barangay) : safeStr(existing.barangay);
  const nextBarangay =
    actor.actorRole === "LGU"
      ? actor.scopeBarangay || ""
      : requestedBarangay;

  if (!nextBarangay) {
    throw new ResponderFeatureError("barangay is required.", 400);
  }

  if (actor.actorRole === "LGU" && payload.barangay && safeStr(payload.barangay) !== actor.scopeBarangay) {
    throw new ResponderFeatureError("LGU can only manage teams in its own barangay.", 403);
  }

  const nextMunicipality =
    payload.municipality !== undefined
      ? safeStr(payload.municipality) || DEFAULT_MUNICIPALITY
      : safeStr(existing.municipality) || DEFAULT_MUNICIPALITY;

  const nextMemberIds =
    payload.memberIds !== undefined
      ? toUniqueMemberIdsWithValidation(payload.memberIds)
      : (existing.memberIds ?? []).map((id) => String(id));

  const parsedLeaderId =
    payload.leaderId !== undefined
      ? normalizeLeaderId(payload.leaderId)
      : existing.leaderId
      ? String(existing.leaderId)
      : undefined;

  const nextLeaderId = parsedLeaderId === null ? null : parsedLeaderId;

  await validateResponderMembers({
    memberIds: nextMemberIds,
    leaderId: nextLeaderId ?? undefined,
    teamBarangay: nextBarangay,
  });

  if (existing.isActive) {
    await ensureTeamNameUniqueAmongActive({
      teamIdToExclude: teamId,
      name: nextName,
      barangay: nextBarangay,
      municipality: nextMunicipality,
    });
  }

  const $set: Record<string, unknown> = {
    name: nextName,
    code: nextCode,
    description: nextDescription,
    barangay: nextBarangay,
    municipality: nextMunicipality,
    memberIds: toObjectIds(nextMemberIds),
    updatedBy: new Types.ObjectId(actor.actorId),
  };
  const $unset: Record<string, unknown> = {};

  if (nextLeaderId === null || nextLeaderId === undefined) {
    $unset.leaderId = 1;
  } else {
    $set.leaderId = new Types.ObjectId(nextLeaderId);
  }

  const updated = await ResponderTeam.findOneAndUpdate(
    buildScopedTeamFilter(actor, teamId),
    {
      $set,
      ...(Object.keys($unset).length > 0 ? { $unset } : {}),
    },
    { new: true }
  )
    .select(
      "_id name code description barangay municipality leaderId memberIds isActive createdBy updatedBy createdAt updatedAt"
    )
    .lean<LeanTeamRow | null>();

  if (!updated) {
    throw new ResponderFeatureError("Responder team not found", 404);
  }

  const membershipChange =
    updated.isActive && nextMemberIds.length > 0
      ? await moveMembersFromOtherActiveTeams({
          targetTeamId: String(updated._id),
          memberIds: nextMemberIds,
          actorId: actor.actorId,
        })
      : {
          reassignedResponderIds: [] as string[],
          affectedTeamIds: [] as string[],
        };

  const normalized = await normalizeTeamResponse(updated);
  return {
    item: normalized,
    membershipChange,
  };
}

export async function setResponderTeamArchiveStateForActor(params: {
  actorId: string;
  actorRole: string;
  teamId: string;
  isActive: boolean;
}) {
  const actor = await resolveResponderActorContext({
    actorId: params.actorId,
    actorRole: params.actorRole,
  });

  const teamId = safeStr(params.teamId);
  if (!Types.ObjectId.isValid(teamId)) {
    throw new ResponderFeatureError("Invalid team id", 400);
  }

  const existing = await readTeamForActorOrThrow({ actor, teamId });

  if (!params.isActive) {
    const archived = await ResponderTeam.findOneAndUpdate(
      buildScopedTeamFilter(actor, teamId),
      {
        $set: {
          isActive: false,
          updatedBy: new Types.ObjectId(actor.actorId),
        },
      },
      { new: true }
    )
      .select(
        "_id name code description barangay municipality leaderId memberIds isActive createdBy updatedBy createdAt updatedAt"
      )
      .lean<LeanTeamRow | null>();

    if (!archived) {
      throw new ResponderFeatureError("Responder team not found", 404);
    }

    const normalized = await normalizeTeamResponse(archived);
    return {
      item: normalized,
      membershipChange: {
        reassignedResponderIds: [] as string[],
        affectedTeamIds: [] as string[],
      },
    };
  }

  await ensureTeamNameUniqueAmongActive({
    teamIdToExclude: teamId,
    name: safeStr(existing.name),
    barangay: safeStr(existing.barangay),
    municipality: safeStr(existing.municipality),
  });

  const memberIds = (existing.memberIds ?? []).map((id) => String(id));
  const leaderId = existing.leaderId ? String(existing.leaderId) : undefined;

  await validateResponderMembers({
    memberIds,
    leaderId,
    teamBarangay: safeStr(existing.barangay),
  });

  const restored = await ResponderTeam.findOneAndUpdate(
    buildScopedTeamFilter(actor, teamId),
    {
      $set: {
        isActive: true,
        updatedBy: new Types.ObjectId(actor.actorId),
      },
    },
    { new: true }
  )
    .select(
      "_id name code description barangay municipality leaderId memberIds isActive createdBy updatedBy createdAt updatedAt"
    )
    .lean<LeanTeamRow | null>();

  if (!restored) {
    throw new ResponderFeatureError("Responder team not found", 404);
  }

  const membershipChange =
    memberIds.length > 0
      ? await moveMembersFromOtherActiveTeams({
          targetTeamId: String(restored._id),
          memberIds,
          actorId: actor.actorId,
        })
      : {
          reassignedResponderIds: [] as string[],
          affectedTeamIds: [] as string[],
        };

  const normalized = await normalizeTeamResponse(restored);
  return {
    item: normalized,
    membershipChange,
  };
}
