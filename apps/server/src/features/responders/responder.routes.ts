import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requirePerm } from "../../middlewares/requirePerm";
import { requireRole } from "../../middlewares/requireRole";
import { validate } from "../../middlewares/validate";
import {
  createResponderAccount,
  getResponderAccountById,
  listDispatchableResponders,
  listResponderAccounts,
  patchResponderAccount,
  reactivateResponderAccount,
  suspendResponderAccount,
} from "./responder.controller";
import {
  createResponderAccountSchema,
  listDispatchableRespondersQuerySchema,
  listResponderAccountsQuerySchema,
  responderAccountIdParamsSchema,
  updateResponderAccountSchema,
} from "./responder.validation";

const router = Router();

router.get(
  "/accounts",
  requireAuth,
  requireRole("LGU", "ADMIN"),
  requirePerm("users.view"),
  validate(listResponderAccountsQuerySchema, "query"),
  listResponderAccounts
);

router.post(
  "/accounts",
  requireAuth,
  requireRole("LGU", "ADMIN"),
  requirePerm("users.manage_volunteers"),
  validate(createResponderAccountSchema),
  createResponderAccount
);

router.get(
  "/accounts/dispatchable/list",
  requireAuth,
  requireRole("LGU", "ADMIN"),
  requirePerm("dispatch.create"),
  validate(listDispatchableRespondersQuerySchema, "query"),
  listDispatchableResponders
);

router.get(
  "/accounts/:id",
  requireAuth,
  requireRole("LGU", "ADMIN"),
  requirePerm("users.view"),
  validate(responderAccountIdParamsSchema, "params"),
  getResponderAccountById
);

router.patch(
  "/accounts/:id",
  requireAuth,
  requireRole("LGU", "ADMIN"),
  requirePerm("users.manage_volunteers"),
  validate(responderAccountIdParamsSchema, "params"),
  validate(updateResponderAccountSchema),
  patchResponderAccount
);

router.post(
  "/accounts/:id/suspend",
  requireAuth,
  requireRole("LGU", "ADMIN"),
  requirePerm("users.manage_volunteers"),
  validate(responderAccountIdParamsSchema, "params"),
  suspendResponderAccount
);

router.post(
  "/accounts/:id/reactivate",
  requireAuth,
  requireRole("LGU", "ADMIN"),
  requirePerm("users.manage_volunteers"),
  validate(responderAccountIdParamsSchema, "params"),
  reactivateResponderAccount
);

export default router;
