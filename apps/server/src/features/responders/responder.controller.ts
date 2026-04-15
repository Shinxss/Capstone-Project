import type { Request, Response } from "express";
import { AUDIT_EVENT } from "../audit/audit.constants";
import { logAudit } from "../audit/audit.service";
import type {
  CreateResponderAccountInput,
  ListDispatchableRespondersQuery,
  ListResponderAccountsQuery,
  UpdateResponderAccountInput,
} from "./responder.validation";
import {
  createResponderAccountForActor,
  getResponderAccountByIdForActor,
  listDispatchableRespondersForActor,
  listResponderAccountsForActor,
  setResponderAccountActivationForActor,
  updateResponderAccountForActor,
} from "./responder.service";
import { isResponderFeatureError } from "./responder.types";

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

function sanitizePayloadForAudit<T extends Record<string, unknown>>(payload: T) {
  const clone = { ...payload };
  delete clone.password;
  return clone;
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

export async function listResponderAccounts(req: AuthedRequest, res: Response) {
  try {
    const actor = getActor(req);
    const query = req.query as unknown as ListResponderAccountsQuery;

    const result = await listResponderAccountsForActor({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      query,
    });

    return res.json(result);
  } catch (error) {
    return handleControllerError(res, error, "Failed to load responder accounts");
  }
}

export async function createResponderAccount(req: AuthedRequest, res: Response) {
  try {
    const actor = getActor(req);
    const payload = req.body as CreateResponderAccountInput;

    const created = await createResponderAccountForActor({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      payload,
    });

    await logAudit(req, {
      eventType: AUDIT_EVENT.RESPONDER_ACCOUNT_CREATE,
      outcome: "SUCCESS",
      actor: {
        id: actor.actorId,
        role: actor.actorRole,
      },
      target: {
        type: "USER",
        id: created.id,
      },
      metadata: {
        responder: sanitizePayloadForAudit(payload),
        barangay: created.barangay,
        municipality: created.municipality,
      },
    });

    return res.status(201).json({ item: created });
  } catch (error) {
    return handleControllerError(res, error, "Failed to create responder account");
  }
}

export async function getResponderAccountById(req: AuthedRequest, res: Response) {
  try {
    const actor = getActor(req);

    const item = await getResponderAccountByIdForActor({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      responderId: String(req.params.id),
    });

    return res.json({ item });
  } catch (error) {
    return handleControllerError(res, error, "Failed to load responder account");
  }
}

export async function patchResponderAccount(req: AuthedRequest, res: Response) {
  try {
    const actor = getActor(req);
    const payload = req.body as UpdateResponderAccountInput;

    const item = await updateResponderAccountForActor({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      responderId: String(req.params.id),
      payload,
    });

    await logAudit(req, {
      eventType: AUDIT_EVENT.RESPONDER_ACCOUNT_UPDATE,
      outcome: "SUCCESS",
      actor: {
        id: actor.actorId,
        role: actor.actorRole,
      },
      target: {
        type: "USER",
        id: item.id,
      },
      metadata: {
        changes: sanitizePayloadForAudit(payload as Record<string, unknown>),
      },
    });

    return res.json({ item });
  } catch (error) {
    return handleControllerError(res, error, "Failed to update responder account");
  }
}

export async function suspendResponderAccount(req: AuthedRequest, res: Response) {
  try {
    const actor = getActor(req);

    const item = await setResponderAccountActivationForActor({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      responderId: String(req.params.id),
      isActive: false,
    });

    await logAudit(req, {
      eventType: AUDIT_EVENT.RESPONDER_ACCOUNT_SUSPEND,
      outcome: "SUCCESS",
      actor: {
        id: actor.actorId,
        role: actor.actorRole,
      },
      target: {
        type: "USER",
        id: item.id,
      },
      metadata: {
        isActive: false,
      },
    });

    return res.json({ item });
  } catch (error) {
    return handleControllerError(res, error, "Failed to suspend responder account");
  }
}

export async function reactivateResponderAccount(req: AuthedRequest, res: Response) {
  try {
    const actor = getActor(req);

    const item = await setResponderAccountActivationForActor({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      responderId: String(req.params.id),
      isActive: true,
    });

    await logAudit(req, {
      eventType: AUDIT_EVENT.RESPONDER_ACCOUNT_REACTIVATE,
      outcome: "SUCCESS",
      actor: {
        id: actor.actorId,
        role: actor.actorRole,
      },
      target: {
        type: "USER",
        id: item.id,
      },
      metadata: {
        isActive: true,
      },
    });

    return res.json({ item });
  } catch (error) {
    return handleControllerError(res, error, "Failed to reactivate responder account");
  }
}

export async function listDispatchableResponders(req: AuthedRequest, res: Response) {
  try {
    const actor = getActor(req);
    const query = req.query as unknown as ListDispatchableRespondersQuery;

    const items = await listDispatchableRespondersForActor({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      query,
    });

    return res.json({ data: items });
  } catch (error) {
    return handleControllerError(res, error, "Failed to load dispatchable responders");
  }
}
