import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requirePerm } from "../../middlewares/requirePerm";
import { requireRole } from "../../middlewares/requireRole";
import { validate } from "../../middlewares/validate";
import {
  archiveResponderTeam,
  createResponderTeam,
  getResponderTeamById,
  listResponderTeams,
  patchResponderTeam,
  restoreResponderTeam,
} from "./responderTeam.controller";
import {
  createResponderTeamSchema,
  listResponderTeamsQuerySchema,
  responderTeamIdParamsSchema,
  updateResponderTeamSchema,
} from "./responderTeam.validation";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireRole("LGU", "ADMIN"),
  requirePerm("users.view"),
  validate(listResponderTeamsQuerySchema, "query"),
  listResponderTeams
);

router.post(
  "/",
  requireAuth,
  requireRole("LGU", "ADMIN"),
  requirePerm("users.manage_volunteers"),
  validate(createResponderTeamSchema),
  createResponderTeam
);

router.get(
  "/:id",
  requireAuth,
  requireRole("LGU", "ADMIN"),
  requirePerm("users.view"),
  validate(responderTeamIdParamsSchema, "params"),
  getResponderTeamById
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("LGU", "ADMIN"),
  requirePerm("users.manage_volunteers"),
  validate(responderTeamIdParamsSchema, "params"),
  validate(updateResponderTeamSchema),
  patchResponderTeam
);

router.post(
  "/:id/archive",
  requireAuth,
  requireRole("LGU", "ADMIN"),
  requirePerm("users.manage_volunteers"),
  validate(responderTeamIdParamsSchema, "params"),
  archiveResponderTeam
);

router.post(
  "/:id/restore",
  requireAuth,
  requireRole("LGU", "ADMIN"),
  requirePerm("users.manage_volunteers"),
  validate(responderTeamIdParamsSchema, "params"),
  restoreResponderTeam
);

export default router;
