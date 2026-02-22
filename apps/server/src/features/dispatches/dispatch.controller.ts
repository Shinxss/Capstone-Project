import { Request, Response } from "express";
import {
  addProofToDispatch,
  completeDispatch,
  createDispatchOffers,
  getMyActiveDispatch,
  getMyCurrentDispatch,
  getMyPendingDispatch,
  listDispatchTasksForLgu,
  respondToDispatch,
  toDispatchDTO,
  verifyDispatch,
} from "./dispatch.service";
import type { DispatchStatus } from "./dispatch.model";
import { AUDIT_EVENT } from "../audit/audit.constants";
import { logAudit } from "../audit/audit.service";
import { emitNotificationsRefresh } from "../../realtime/notificationsSocket";

function getAuth(req: Request) {
  const role = (req as any).user?.role ?? (req as any).role;
  const userId = (req as any).user?.id ?? (req as any).userId;
  return { role: String(role || ""), userId: String(userId || "") };
}

export async function postDispatchOffers(req: Request, res: Response) {
  try {
    const { role, userId } = getAuth(req);

    if (role !== "LGU" && role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { emergencyId, volunteerIds } = (req.body ?? {}) as {
      emergencyId?: string;
      volunteerIds?: string[];
    };

    const created = await createDispatchOffers({
      emergencyId: String(emergencyId ?? ""),
      volunteerIds: Array.isArray(volunteerIds) ? volunteerIds : [],
      createdByUserId: String(userId),
    });

    await logAudit(req, {
      eventType: AUDIT_EVENT.DISPATCH_CREATE,
      outcome: "SUCCESS",
      actor: { id: userId, role },
      target: { type: "DISPATCH" },
      metadata: {
        emergencyId: String(emergencyId ?? ""),
        createdCount: created.length,
      },
    });

    return res.status(201).json({ message: "Dispatch offers created", count: created.length });
  } catch (e: any) {
    return res.status(400).json({ message: e?.message ?? "Failed to dispatch" });
  }
}

export async function getMyPending(req: Request, res: Response) {
  try {
    const { role, userId } = getAuth(req);
    if (role !== "VOLUNTEER") return res.status(403).json({ message: "Forbidden" });

    const pending = await getMyPendingDispatch(String(userId));
    return res.json({ data: toDispatchDTO(pending) });
  } catch (e: any) {
    return res.status(400).json({ message: e?.message ?? "Failed" });
  }
}

export async function getMyActive(req: Request, res: Response) {
  try {
    const { role, userId } = getAuth(req);
    if (role !== "VOLUNTEER") return res.status(403).json({ message: "Forbidden" });

    const active = await getMyActiveDispatch(String(userId));
    return res.json({ data: toDispatchDTO(active) });
  } catch (e: any) {
    return res.status(400).json({ message: e?.message ?? "Failed" });
  }
}

export async function getMyCurrent(req: Request, res: Response) {
  try {
    const { role, userId } = getAuth(req);
    if (role !== "VOLUNTEER") return res.status(403).json({ message: "Forbidden" });

    const current = await getMyCurrentDispatch(String(userId));
    return res.json({ data: toDispatchDTO(current) });
  } catch (e: any) {
    return res.status(400).json({ message: e?.message ?? "Failed" });
  }
}

export async function patchRespond(req: Request, res: Response) {
  try {
    const { role, userId } = getAuth(req);
    if (role !== "VOLUNTEER") return res.status(403).json({ message: "Forbidden" });

    const decision = String(req.body?.decision ?? "").toUpperCase();
    if (decision !== "ACCEPT" && decision !== "DECLINE") {
      return res.status(400).json({ message: "decision must be ACCEPT or DECLINE" });
    }

    const offer = await respondToDispatch({
      dispatchId: String(req.params.id),
      volunteerUserId: String(userId),
      decision: decision as any,
    });

    await logAudit(req, {
      eventType: AUDIT_EVENT.DISPATCH_STATUS_CHANGE,
      outcome: "SUCCESS",
      actor: { id: userId, role },
      target: { type: "DISPATCH", id: String(req.params.id) },
      metadata: {
        decision,
      },
    });

    if (decision === "ACCEPT") {
      emitNotificationsRefresh("dispatch_accepted", ["LGU", "ADMIN"]);
    }

    return res.json({ data: toDispatchDTO(offer) });
  } catch (e: any) {
    return res.status(400).json({ message: e?.message ?? "Failed" });
  }
}

export async function postProof(req: Request, res: Response) {
  try {
    const { role, userId } = getAuth(req);
    if (role !== "VOLUNTEER") return res.status(403).json({ message: "Forbidden" });

    const { base64, mimeType, fileName } = (req.body ?? {}) as {
      base64?: string;
      mimeType?: string;
      fileName?: string;
    };

    const updated = await addProofToDispatch({
      dispatchId: String(req.params.id),
      volunteerUserId: String(userId),
      base64: String(base64 ?? ""),
      mimeType: mimeType ? String(mimeType) : undefined,
      fileName: fileName ? String(fileName) : undefined,
    });

    await logAudit(req, {
      eventType: AUDIT_EVENT.DISPATCH_UPDATE,
      outcome: "SUCCESS",
      actor: { id: userId, role },
      target: { type: "DISPATCH", id: String(req.params.id) },
      metadata: {
        updateType: "proof_upload",
        proofCount: Array.isArray((updated as any).proofs) ? (updated as any).proofs.length : 0,
      },
    });

    return res.json({ data: toDispatchDTO(updated) });
  } catch (e: any) {
    return res.status(400).json({ message: e?.message ?? "Failed" });
  }
}

export async function patchComplete(req: Request, res: Response) {
  try {
    const { role, userId } = getAuth(req);
    if (role !== "VOLUNTEER") return res.status(403).json({ message: "Forbidden" });

    const updated = await completeDispatch({ dispatchId: String(req.params.id), volunteerUserId: String(userId) });

    await logAudit(req, {
      eventType: AUDIT_EVENT.DISPATCH_STATUS_CHANGE,
      outcome: "SUCCESS",
      actor: { id: userId, role },
      target: { type: "DISPATCH", id: String(req.params.id) },
      metadata: {
        nextStatus: "DONE",
      },
    });

    emitNotificationsRefresh("dispatch_completed", ["LGU", "ADMIN"]);

    return res.json({ data: toDispatchDTO(updated) });
  } catch (e: any) {
    return res.status(400).json({ message: e?.message ?? "Failed" });
  }
}

export async function getLguTasks(req: Request, res: Response) {
  try {
    const { role, userId } = getAuth(req);
    if (role !== "LGU" && role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });

    const raw = String((req.query as any).status ?? "").trim();
    const statuses: DispatchStatus[] = raw
      ? (raw.split(",").map((s) => s.trim().toUpperCase()) as any)
      : ["ACCEPTED"];

    const docs = await listDispatchTasksForLgu({ statuses });
    return res.json({ data: docs.map(toDispatchDTO), count: docs.length });
  } catch (e: any) {
    return res.status(400).json({ message: e?.message ?? "Failed" });
  }
}

export async function patchVerify(req: Request, res: Response) {
  try {
    const { role, userId } = getAuth(req);
    if (role !== "LGU") return res.status(403).json({ message: "Forbidden" });

    const { txHash } = await verifyDispatch({ dispatchId: String(req.params.id), verifierUserId: String(userId) });

    await logAudit(req, {
      eventType: AUDIT_EVENT.DISPATCH_STATUS_CHANGE,
      outcome: "SUCCESS",
      actor: { id: userId, role },
      target: { type: "DISPATCH", id: String(req.params.id) },
      metadata: {
        nextStatus: "VERIFIED",
        txHash,
      },
    });

    emitNotificationsRefresh("dispatch_verified", ["LGU", "ADMIN"]);

    return res.json({ success: true, txHash });
  } catch (e: any) {
    return res.status(400).json({ message: e?.message ?? "Failed" });
  }
}
