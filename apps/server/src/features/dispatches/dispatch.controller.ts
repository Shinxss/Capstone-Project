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
import { getAuditRequestContext, logAuditEvent } from "../audit/audit.service";

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

    const requestContext = getAuditRequestContext(req);
    await logAuditEvent({
      actorId: userId,
      actorRole: role,
      action: "DISPATCH_PROOF_UPLOAD",
      targetType: "DispatchOffer",
      targetId: String(req.params.id),
      metadata: {
        proofCount: Array.isArray((updated as any).proofs) ? (updated as any).proofs.length : 0,
      },
      ip: requestContext.ip,
      userAgent: requestContext.userAgent,
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
    const requestContext = getAuditRequestContext(req);
    await logAuditEvent({
      actorId: userId,
      actorRole: role,
      action: "DISPATCH_VERIFY",
      targetType: "DispatchOffer",
      targetId: String(req.params.id),
      metadata: { txHash },
      ip: requestContext.ip,
      userAgent: requestContext.userAgent,
    });

    return res.json({ success: true, txHash });
  } catch (e: any) {
    return res.status(400).json({ message: e?.message ?? "Failed" });
  }
}
