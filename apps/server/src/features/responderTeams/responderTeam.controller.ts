import type { Request, Response } from "express";
import { AUDIT_EVENT } from "../audit/audit.constants";
import { logAudit } from "../audit/audit.service";
import {
  createResponderTeamForActor,
  getResponderTeamByIdForActor,
  listResponderTeamsForActor,
  setResponderTeamArchiveStateForActor,
  updateResponderTeamForActor,
} from "./responderTeam.service";
import type {
  CreateResponderTeamInput,
  ListResponderTeamsQuery,
  UpdateResponderTeamInput,
} from "./responderTeam.validation";
import { isResponderFeatureError } from "../responders/responder.types";

type AuthedRequest = Request & {
  user?: { id?: string; role?: string };
  userId?: string;
  role?: string;
};

function getActor(req: AuthedRequest) {
  const actorId = String(req.user?.id ?? req.userId ?? "").trim();
  const actorRole = String(req.user?.role ?? req.role ?? "").trim().toUpperCase();

  if (!actorId || !actorRole) {
    throw new Error("Unauthorized");
  }

  return { actorId, actorRole };
}

function handleControllerError(res: Response, error: unknown, fallbackMessage: string) {
  if (isResponderFeatureError(error)) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  const typed = error as { statusCode?: number; status?: number; message?: string };
  const statusCode =
    typeof typed.statusCode === "number"
      ? typed.statusCode
      : typeof typed.status === "number"
      ? typed.status
      : 500;

  const message = statusCode >= 500 ? fallbackMessage : String(typed.message ?? fallbackMessage);
  return res.status(statusCode).json({ message });
}

function shouldWriteMembershipAudit(payload: UpdateResponderTeamInput) {
  return payload.memberIds !== undefined || payload.leaderId !== undefined;
}

export async function listResponderTeams(req: AuthedRequest, res: Response) {
  try {
    const actor = getActor(req);
    const query = req.query as unknown as ListResponderTeamsQuery;

    const result = await listResponderTeamsForActor({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      query,
    });

    return res.json(result);
  } catch (error) {
    return handleControllerError(res, error, "Failed to load responder teams");
  }
}

export async function createResponderTeam(req: AuthedRequest, res: Response) {
  try {
    const actor = getActor(req);
    const payload = req.body as CreateResponderTeamInput;

    const result = await createResponderTeamForActor({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      payload,
    });

    await logAudit(req, {
      eventType: AUDIT_EVENT.RESPONDER_TEAM_CREATE,
      outcome: "SUCCESS",
      actor: {
        id: actor.actorId,
        role: actor.actorRole,
      },
      target: {
        type: "RESPONDER_TEAM",
        id: result.item.id,
      },
      metadata: {
        team: {
          name: result.item.name,
          code: result.item.code,
          barangay: result.item.barangay,
          municipality: result.item.municipality,
          memberCount: result.item.memberCount,
          isActive: result.item.isActive,
        },
      },
    });

    if (
      result.membershipChange.reassignedResponderIds.length > 0 ||
      result.membershipChange.affectedTeamIds.length > 0
    ) {
      await logAudit(req, {
        eventType: AUDIT_EVENT.RESPONDER_TEAM_MEMBERSHIP_CHANGE,
        outcome: "SUCCESS",
        actor: {
          id: actor.actorId,
          role: actor.actorRole,
        },
        target: {
          type: "RESPONDER_TEAM",
          id: result.item.id,
        },
        metadata: {
          action: "MEMBER_REASSIGNMENT",
          reassignedResponderIds: result.membershipChange.reassignedResponderIds,
          affectedTeamIds: result.membershipChange.affectedTeamIds,
        },
      });
    }

    return res.status(201).json({ item: result.item });
  } catch (error) {
    return handleControllerError(res, error, "Failed to create responder team");
  }
}

export async function getResponderTeamById(req: AuthedRequest, res: Response) {
  try {
    const actor = getActor(req);

    const item = await getResponderTeamByIdForActor({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      teamId: String(req.params.id),
    });

    return res.json({ item });
  } catch (error) {
    return handleControllerError(res, error, "Failed to load responder team");
  }
}

export async function patchResponderTeam(req: AuthedRequest, res: Response) {
  try {
    const actor = getActor(req);
    const payload = req.body as UpdateResponderTeamInput;

    const result = await updateResponderTeamForActor({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      teamId: String(req.params.id),
      payload,
    });

    await logAudit(req, {
      eventType: AUDIT_EVENT.RESPONDER_TEAM_UPDATE,
      outcome: "SUCCESS",
      actor: {
        id: actor.actorId,
        role: actor.actorRole,
      },
      target: {
        type: "RESPONDER_TEAM",
        id: result.item.id,
      },
      metadata: {
        changes: payload,
      },
    });

    if (
      shouldWriteMembershipAudit(payload) ||
      result.membershipChange.reassignedResponderIds.length > 0 ||
      result.membershipChange.affectedTeamIds.length > 0
    ) {
      await logAudit(req, {
        eventType: AUDIT_EVENT.RESPONDER_TEAM_MEMBERSHIP_CHANGE,
        outcome: "SUCCESS",
        actor: {
          id: actor.actorId,
          role: actor.actorRole,
        },
        target: {
          type: "RESPONDER_TEAM",
          id: result.item.id,
        },
        metadata: {
          action: "TEAM_UPDATE",
          memberIds: payload.memberIds,
          leaderId: payload.leaderId,
          reassignedResponderIds: result.membershipChange.reassignedResponderIds,
          affectedTeamIds: result.membershipChange.affectedTeamIds,
        },
      });
    }

    return res.json({ item: result.item });
  } catch (error) {
    return handleControllerError(res, error, "Failed to update responder team");
  }
}

export async function archiveResponderTeam(req: AuthedRequest, res: Response) {
  try {
    const actor = getActor(req);

    const result = await setResponderTeamArchiveStateForActor({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      teamId: String(req.params.id),
      isActive: false,
    });

    await logAudit(req, {
      eventType: AUDIT_EVENT.RESPONDER_TEAM_ARCHIVE,
      outcome: "SUCCESS",
      actor: {
        id: actor.actorId,
        role: actor.actorRole,
      },
      target: {
        type: "RESPONDER_TEAM",
        id: result.item.id,
      },
      metadata: {
        isActive: false,
      },
    });

    return res.json({ item: result.item });
  } catch (error) {
    return handleControllerError(res, error, "Failed to archive responder team");
  }
}

export async function restoreResponderTeam(req: AuthedRequest, res: Response) {
  try {
    const actor = getActor(req);

    const result = await setResponderTeamArchiveStateForActor({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      teamId: String(req.params.id),
      isActive: true,
    });

    await logAudit(req, {
      eventType: AUDIT_EVENT.RESPONDER_TEAM_RESTORE,
      outcome: "SUCCESS",
      actor: {
        id: actor.actorId,
        role: actor.actorRole,
      },
      target: {
        type: "RESPONDER_TEAM",
        id: result.item.id,
      },
      metadata: {
        isActive: true,
      },
    });

    if (
      result.membershipChange.reassignedResponderIds.length > 0 ||
      result.membershipChange.affectedTeamIds.length > 0
    ) {
      await logAudit(req, {
        eventType: AUDIT_EVENT.RESPONDER_TEAM_MEMBERSHIP_CHANGE,
        outcome: "SUCCESS",
        actor: {
          id: actor.actorId,
          role: actor.actorRole,
        },
        target: {
          type: "RESPONDER_TEAM",
          id: result.item.id,
        },
        metadata: {
          action: "TEAM_RESTORE_MEMBER_REASSIGNMENT",
          reassignedResponderIds: result.membershipChange.reassignedResponderIds,
          affectedTeamIds: result.membershipChange.affectedTeamIds,
        },
      });
    }

    return res.json({ item: result.item });
  } catch (error) {
    return handleControllerError(res, error, "Failed to restore responder team");
  }
}
