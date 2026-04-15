import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { getVolunteerPresenceStatus } from "../../realtime/notificationsSocket";
import { ResponderTeam } from "../responderTeams/responderTeam.model";
import { User } from "../users/user.model";
import { generateNextLifelineId } from "../users/userId.service";
import type {
  CreateResponderAccountInput,
  ListDispatchableRespondersQuery,
  ListResponderAccountsQuery,
  UpdateResponderAccountInput,
} from "./responder.validation";
import {
  ResponderFeatureError,
  type DispatchableResponderItem,
  type ResponderActorContext,
  type ResponderAccountListItem,
  type ResponderTeamSummary,
} from "./responder.types";

const DEFAULT_MUNICIPALITY = "Dagupan City";

type LeanResponderUser = {
  _id: Types.ObjectId;
  lifelineId?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  contactNo?: string;
  barangay?: string;
  municipality?: string;
  skills?: string;
  onDuty?: boolean;
  isActive?: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};

function safeStr(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: unknown) {
  const cleaned = safeStr(value).toLowerCase();
  return cleaned || undefined;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fullNameFromUser(user: {
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

function asObjectId(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new ResponderFeatureError("Invalid ObjectId", 400);
  }
  return new Types.ObjectId(id);
}

function applyResponderSearchFilter(match: Record<string, unknown>, query: string | undefined) {
  const q = safeStr(query);
  if (!q) return;

  const regex = new RegExp(escapeRegExp(q), "i");
  match.$or = [
    { username: regex },
    { email: regex },
    { firstName: regex },
    { lastName: regex },
    { contactNo: regex },
    { lifelineId: regex },
    { skills: regex },
  ];
}

function toDispatchAvailability(
  presence: ReturnType<typeof getVolunteerPresenceStatus>
): DispatchableResponderItem["status"] {
  return presence === "OFFLINE" ? "offline" : "available";
}

function mapResponderRow(
  row: LeanResponderUser,
  teamMap: Map<string, ResponderTeamSummary>
): ResponderAccountListItem {
  const id = String(row._id);

  return {
    id,
    lifelineId: safeStr(row.lifelineId) || undefined,
    username: safeStr(row.username) || undefined,
    firstName: safeStr(row.firstName),
    lastName: safeStr(row.lastName),
    fullName: fullNameFromUser(row),
    email: safeStr(row.email) || undefined,
    contactNo: safeStr(row.contactNo) || undefined,
    barangay: safeStr(row.barangay),
    municipality: safeStr(row.municipality),
    skills: safeStr(row.skills) || undefined,
    onDuty: Boolean(row.onDuty ?? true),
    isActive: Boolean(row.isActive ?? true),
    team: teamMap.get(id) ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function buildActiveTeamByMemberMap(memberIds: string[]) {
  const objectIds = memberIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objectIds.length === 0) return new Map<string, ResponderTeamSummary>();

  const teams = await ResponderTeam.find({
    isActive: true,
    memberIds: { $in: objectIds },
  })
    .select("_id name code isActive memberIds")
    .sort({ updatedAt: -1, _id: -1 })
    .lean();

  const byMemberId = new Map<string, ResponderTeamSummary>();
  for (const team of teams) {
    const summary: ResponderTeamSummary = {
      id: String(team._id),
      name: safeStr(team.name),
      code: safeStr(team.code) || undefined,
      isActive: Boolean(team.isActive),
    };

    for (const memberId of team.memberIds ?? []) {
      const key = String(memberId);
      if (!byMemberId.has(key)) {
        byMemberId.set(key, summary);
      }
    }
  }

  return byMemberId;
}

function parseDuplicateField(error: unknown) {
  const typed = error as { code?: unknown; keyPattern?: Record<string, unknown>; message?: unknown };
  const isDuplicate = typed?.code === 11000 || String(typed?.message ?? "").includes("E11000");
  if (!isDuplicate) return null;

  const keyPattern = typed?.keyPattern ?? {};
  const field = Object.keys(keyPattern)[0] || "field";

  if (field === "username") return "Username is already in use.";
  if (field === "email") return "Email is already in use.";
  if (field === "lifelineId") return "Generated Lifeline ID already exists. Please retry.";
  return "Duplicate value is not allowed.";
}

async function ensureUniqueResponderIdentity(params: {
  username?: string;
  email?: string;
  excludeUserId?: string;
}) {
  const username = safeStr(params.username);
  const email = normalizeEmail(params.email);
  const excludeId = safeStr(params.excludeUserId);

  if (username) {
    const existingByUsername = await User.findOne({
      username,
      ...(excludeId && Types.ObjectId.isValid(excludeId) ? { _id: { $ne: new Types.ObjectId(excludeId) } } : {}),
    })
      .select("_id")
      .lean();

    if (existingByUsername) {
      throw new ResponderFeatureError("Username is already in use.", 409);
    }
  }

  if (email) {
    const existingByEmail = await User.findOne({
      email,
      ...(excludeId && Types.ObjectId.isValid(excludeId) ? { _id: { $ne: new Types.ObjectId(excludeId) } } : {}),
    })
      .select("_id")
      .lean();

    if (existingByEmail) {
      throw new ResponderFeatureError("Email is already in use.", 409);
    }
  }
}

export async function resolveResponderActorContext(params: {
  actorId: string;
  actorRole: string;
}): Promise<ResponderActorContext> {
  const actorId = safeStr(params.actorId);
  if (!Types.ObjectId.isValid(actorId)) {
    throw new ResponderFeatureError("Unauthorized", 401);
  }

  const role = safeStr(params.actorRole).toUpperCase();
  if (role !== "LGU" && role !== "ADMIN") {
    throw new ResponderFeatureError("Forbidden", 403);
  }

  if (role === "ADMIN") {
    return {
      actorId,
      actorRole: "ADMIN",
    };
  }

  const actor = await User.findById(actorId).select("role barangay").lean();
  if (!actor || String(actor.role ?? "").toUpperCase() !== "LGU") {
    throw new ResponderFeatureError("Forbidden", 403);
  }

  const scopeBarangay = safeStr(actor.barangay);
  if (!scopeBarangay) {
    throw new ResponderFeatureError("LGU account has no barangay scope.", 403);
  }

  return {
    actorId,
    actorRole: "LGU",
    scopeBarangay,
  };
}

function applyBarangayScope(
  match: Record<string, unknown>,
  actor: ResponderActorContext,
  barangayFilter?: string
) {
  const requestedBarangay = safeStr(barangayFilter);
  if (actor.actorRole === "LGU") {
    if (requestedBarangay && requestedBarangay !== actor.scopeBarangay) {
      match._id = { $exists: false };
      return;
    }

    match.barangay = actor.scopeBarangay;
    return;
  }

  if (requestedBarangay) {
    match.barangay = requestedBarangay;
  }
}

async function resolveResponderIdsFromTeamFilter(
  actor: ResponderActorContext,
  teamId: string | undefined,
  options?: { dispatchableOnly?: boolean }
) {
  const normalizedTeamId = safeStr(teamId);
  if (!normalizedTeamId) return null;

  const team = await ResponderTeam.findById(normalizedTeamId)
    .select("_id barangay isActive memberIds")
    .lean();

  if (!team) return [];

  if (actor.actorRole === "LGU" && safeStr(team.barangay) !== actor.scopeBarangay) {
    return [];
  }

  if (options?.dispatchableOnly && !team.isActive) {
    throw new ResponderFeatureError("Archived teams cannot be used for dispatch assignments.", 400);
  }

  const memberIds = (team.memberIds ?? [])
    .map((id: Types.ObjectId | string) => String(id))
    .filter((id: string) => Types.ObjectId.isValid(id));
  return memberIds;
}

export async function listResponderAccountsForActor(params: {
  actorId: string;
  actorRole: string;
  query: ListResponderAccountsQuery;
}) {
  const actor = await resolveResponderActorContext({
    actorId: params.actorId,
    actorRole: params.actorRole,
  });

  const match: Record<string, unknown> = {
    role: "RESPONDER",
  };

  applyBarangayScope(match, actor, params.query.barangay);
  applyResponderSearchFilter(match, params.query.q);

  if (params.query.isActive === "true" || params.query.isActive === "false") {
    match.isActive = params.query.isActive === "true";
  }

  if (params.query.onDuty === "true" || params.query.onDuty === "false") {
    match.onDuty = params.query.onDuty === "true";
  }

  const teamMemberIds = await resolveResponderIdsFromTeamFilter(actor, params.query.teamId);
  if (Array.isArray(teamMemberIds)) {
    if (teamMemberIds.length === 0) {
      return {
        items: [] as ResponderAccountListItem[],
        pagination: {
          page: params.query.page,
          limit: params.query.limit,
          total: 0,
          totalPages: 1,
        },
      };
    }

    match._id = {
      ...(match._id && typeof match._id === "object" ? (match._id as Record<string, unknown>) : {}),
      $in: teamMemberIds.map((id) => new Types.ObjectId(id)),
    };
  }

  const [rows, total] = await Promise.all([
    User.find(match)
      .select(
        "_id lifelineId username firstName lastName email contactNo barangay municipality skills onDuty isActive createdAt updatedAt"
      )
      .sort({ createdAt: -1, _id: -1 })
      .skip((params.query.page - 1) * params.query.limit)
      .limit(params.query.limit)
      .lean<LeanResponderUser[]>(),
    User.countDocuments(match),
  ]);

  const memberIds = rows.map((row) => String(row._id));
  const activeTeamMap = await buildActiveTeamByMemberMap(memberIds);
  const items = rows.map((row) => mapResponderRow(row, activeTeamMap));

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

export async function getResponderAccountByIdForActor(params: {
  actorId: string;
  actorRole: string;
  responderId: string;
}) {
  const actor = await resolveResponderActorContext({
    actorId: params.actorId,
    actorRole: params.actorRole,
  });

  const responderId = safeStr(params.responderId);
  if (!Types.ObjectId.isValid(responderId)) {
    throw new ResponderFeatureError("Invalid responder id", 400);
  }

  const match: Record<string, unknown> = {
    _id: new Types.ObjectId(responderId),
    role: "RESPONDER",
  };

  if (actor.actorRole === "LGU") {
    match.barangay = actor.scopeBarangay;
  }

  const row = await User.findOne(match)
    .select(
      "_id lifelineId username firstName lastName email contactNo barangay municipality skills onDuty isActive createdAt updatedAt"
    )
    .lean<LeanResponderUser | null>();

  if (!row) {
    throw new ResponderFeatureError("Responder account not found", 404);
  }

  const [activeTeamMap, allTeams] = await Promise.all([
    buildActiveTeamByMemberMap([String(row._id)]),
    ResponderTeam.find({
      memberIds: row._id,
      ...(actor.actorRole === "LGU" ? { barangay: actor.scopeBarangay } : {}),
    })
      .select("_id name code isActive")
      .sort({ isActive: -1, updatedAt: -1, _id: -1 })
      .lean(),
  ]);

  const mapped = mapResponderRow(row, activeTeamMap);
  return {
    ...mapped,
    teams: allTeams.map((team) => ({
      id: String(team._id),
      name: safeStr(team.name),
      code: safeStr(team.code) || undefined,
      isActive: Boolean(team.isActive),
    })),
  };
}

export async function createResponderAccountForActor(params: {
  actorId: string;
  actorRole: string;
  payload: CreateResponderAccountInput;
}) {
  const actor = await resolveResponderActorContext({
    actorId: params.actorId,
    actorRole: params.actorRole,
  });

  const username = safeStr(params.payload.username);
  const email = normalizeEmail(params.payload.email);
  const firstName = safeStr(params.payload.firstName);
  const lastName = safeStr(params.payload.lastName);
  const password = String(params.payload.password ?? "");
  const contactNo = safeStr(params.payload.contactNo);
  const skills = safeStr(params.payload.skills);

  if (!username || !firstName || !lastName || !password) {
    throw new ResponderFeatureError("Missing required responder account fields.", 400);
  }

  const barangay =
    actor.actorRole === "LGU"
      ? actor.scopeBarangay || ""
      : safeStr(params.payload.barangay);

  if (!barangay) {
    throw new ResponderFeatureError("barangay is required.", 400);
  }

  const municipality = safeStr(params.payload.municipality) || DEFAULT_MUNICIPALITY;

  await ensureUniqueResponderIdentity({ username, email });

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const created = await User.create({
      username,
      email,
      lifelineId: await generateNextLifelineId(),
      firstName,
      lastName,
      passwordHash,
      authProvider: "local",
      emailVerified: true,
      role: "RESPONDER",
      volunteerStatus: "NONE",
      contactNo,
      barangay,
      municipality,
      skills,
      onDuty: params.payload.onDuty ?? true,
      isActive: params.payload.isActive ?? true,
    });

    const activeTeamMap = await buildActiveTeamByMemberMap([String(created._id)]);
    return mapResponderRow(created.toObject() as LeanResponderUser, activeTeamMap);
  } catch (error) {
    const duplicateMessage = parseDuplicateField(error);
    if (duplicateMessage) {
      throw new ResponderFeatureError(duplicateMessage, 409);
    }
    throw error;
  }
}

export async function updateResponderAccountForActor(params: {
  actorId: string;
  actorRole: string;
  responderId: string;
  payload: UpdateResponderAccountInput;
}) {
  const actor = await resolveResponderActorContext({
    actorId: params.actorId,
    actorRole: params.actorRole,
  });

  const responderId = safeStr(params.responderId);
  if (!Types.ObjectId.isValid(responderId)) {
    throw new ResponderFeatureError("Invalid responder id", 400);
  }

  const existing = await User.findOne({
    _id: new Types.ObjectId(responderId),
    role: "RESPONDER",
    ...(actor.actorRole === "LGU" ? { barangay: actor.scopeBarangay } : {}),
  })
    .select("_id username email barangay")
    .lean();

  if (!existing) {
    throw new ResponderFeatureError("Responder account not found", 404);
  }

  const payload = params.payload;
  const hasPayloadKeys = Object.keys(payload).length > 0;
  if (!hasPayloadKeys) {
    throw new ResponderFeatureError("No updates provided", 400);
  }

  const $set: Record<string, unknown> = {};
  const $unset: Record<string, unknown> = {};

  if (payload.username !== undefined) {
    const username = safeStr(payload.username);
    if (!username) throw new ResponderFeatureError("username cannot be empty.", 400);
    $set.username = username;
  }

  if (payload.password !== undefined) {
    const password = String(payload.password ?? "");
    if (!password) throw new ResponderFeatureError("password cannot be empty.", 400);
    $set.passwordHash = await bcrypt.hash(password, 10);
    $set.authProvider = "local";
  }

  if (payload.firstName !== undefined) {
    const firstName = safeStr(payload.firstName);
    if (!firstName) throw new ResponderFeatureError("firstName cannot be empty.", 400);
    $set.firstName = firstName;
  }

  if (payload.lastName !== undefined) {
    const lastName = safeStr(payload.lastName);
    if (!lastName) throw new ResponderFeatureError("lastName cannot be empty.", 400);
    $set.lastName = lastName;
  }

  if (payload.email !== undefined) {
    const email = normalizeEmail(payload.email);
    if (email) {
      $set.email = email;
    } else {
      $unset.email = 1;
    }
  }

  if (payload.contactNo !== undefined) {
    $set.contactNo = safeStr(payload.contactNo);
  }

  if (payload.skills !== undefined) {
    $set.skills = safeStr(payload.skills);
  }

  if (payload.onDuty !== undefined) {
    $set.onDuty = Boolean(payload.onDuty);
  }

  if (payload.isActive !== undefined) {
    $set.isActive = Boolean(payload.isActive);
  }

  if (payload.barangay !== undefined) {
    const requestedBarangay = safeStr(payload.barangay);
    if (!requestedBarangay) {
      throw new ResponderFeatureError("barangay cannot be empty.", 400);
    }

    if (actor.actorRole === "LGU") {
      if (requestedBarangay !== actor.scopeBarangay) {
        throw new ResponderFeatureError("LGU can only manage responder accounts in its own barangay.", 403);
      }
      $set.barangay = actor.scopeBarangay;
    } else {
      $set.barangay = requestedBarangay;
    }
  }

  if (payload.municipality !== undefined) {
    const municipality = safeStr(payload.municipality);
    if (!municipality) {
      throw new ResponderFeatureError("municipality cannot be empty.", 400);
    }
    $set.municipality = municipality;
  }

  await ensureUniqueResponderIdentity({
    username: String($set.username ?? ""),
    email:
      payload.email !== undefined
        ? normalizeEmail(payload.email)
        : undefined,
    excludeUserId: responderId,
  });

  try {
    const updated = await User.findOneAndUpdate(
      {
        _id: new Types.ObjectId(responderId),
        role: "RESPONDER",
        ...(actor.actorRole === "LGU" ? { barangay: actor.scopeBarangay } : {}),
      },
      {
        ...(Object.keys($set).length > 0 ? { $set } : {}),
        ...(Object.keys($unset).length > 0 ? { $unset } : {}),
      },
      { new: true }
    )
      .select(
        "_id lifelineId username firstName lastName email contactNo barangay municipality skills onDuty isActive createdAt updatedAt"
      )
      .lean<LeanResponderUser | null>();

    if (!updated) {
      throw new ResponderFeatureError("Responder account not found", 404);
    }

    const activeTeamMap = await buildActiveTeamByMemberMap([String(updated._id)]);
    return mapResponderRow(updated, activeTeamMap);
  } catch (error) {
    if (isResponderFeatureError(error)) {
      throw error;
    }

    const duplicateMessage = parseDuplicateField(error);
    if (duplicateMessage) {
      throw new ResponderFeatureError(duplicateMessage, 409);
    }

    throw error;
  }
}

export async function setResponderAccountActivationForActor(params: {
  actorId: string;
  actorRole: string;
  responderId: string;
  isActive: boolean;
}) {
  const actor = await resolveResponderActorContext({
    actorId: params.actorId,
    actorRole: params.actorRole,
  });

  const responderId = safeStr(params.responderId);
  if (!Types.ObjectId.isValid(responderId)) {
    throw new ResponderFeatureError("Invalid responder id", 400);
  }

  const updated = await User.findOneAndUpdate(
    {
      _id: new Types.ObjectId(responderId),
      role: "RESPONDER",
      ...(actor.actorRole === "LGU" ? { barangay: actor.scopeBarangay } : {}),
    },
    { $set: { isActive: params.isActive } },
    { new: true }
  )
    .select(
      "_id lifelineId username firstName lastName email contactNo barangay municipality skills onDuty isActive createdAt updatedAt"
    )
    .lean<LeanResponderUser | null>();

  if (!updated) {
    throw new ResponderFeatureError("Responder account not found", 404);
  }

  const activeTeamMap = await buildActiveTeamByMemberMap([String(updated._id)]);
  return mapResponderRow(updated, activeTeamMap);
}

export async function listDispatchableRespondersForActor(params: {
  actorId: string;
  actorRole: string;
  query: ListDispatchableRespondersQuery;
}) {
  const actor = await resolveResponderActorContext({
    actorId: params.actorId,
    actorRole: params.actorRole,
  });

  const match: Record<string, unknown> = {
    role: "RESPONDER",
    isActive: true,
    onDuty: true,
  };

  applyBarangayScope(match, actor, params.query.barangay);
  applyResponderSearchFilter(match, params.query.q);

  const teamMemberIds = await resolveResponderIdsFromTeamFilter(actor, params.query.teamId, {
    dispatchableOnly: true,
  });
  if (Array.isArray(teamMemberIds)) {
    if (teamMemberIds.length === 0) return [] as DispatchableResponderItem[];
    match._id = {
      ...(match._id && typeof match._id === "object" ? (match._id as Record<string, unknown>) : {}),
      $in: teamMemberIds.map((id) => new Types.ObjectId(id)),
    };
  }

  const rows = await User.find(match)
    .select("_id lifelineId username firstName lastName email skills barangay municipality avatarUrl")
    .sort({ onDuty: -1, updatedAt: -1, createdAt: -1 })
    .limit(params.query.limit)
    .lean<LeanResponderUser[]>();

  const activeTeamMap = await buildActiveTeamByMemberMap(rows.map((row) => String(row._id)));

  return rows.map((row) => {
    const id = String(row._id);
    const team = activeTeamMap.get(id);

    return {
      id,
      lifelineId: safeStr(row.lifelineId) || undefined,
      name: fullNameFromUser(row),
      status: toDispatchAvailability(getVolunteerPresenceStatus(id)),
      skill: safeStr(row.skills) || "General Responder",
      barangay: safeStr(row.barangay) || undefined,
      municipality: safeStr(row.municipality) || undefined,
      avatarUrl: safeStr(row.avatarUrl) || undefined,
      teamId: team?.id,
      teamName: team?.name,
    } satisfies DispatchableResponderItem;
  });
}

function isResponderFeatureError(error: unknown): error is ResponderFeatureError {
  return Boolean(
    error &&
      typeof error === "object" &&
      "statusCode" in error &&
      typeof (error as { statusCode?: unknown }).statusCode === "number"
  );
}

export function createResponderServiceError(message: string, statusCode: number) {
  return new ResponderFeatureError(message, statusCode);
}

export function ensureValidObjectId(value: string) {
  return asObjectId(value);
}
